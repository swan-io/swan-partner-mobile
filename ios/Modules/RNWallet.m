#import "RNWallet.h"

#import <PassKit/PassKit.h>
#import <React/RCTUtils.h>

@interface RNWallet() <PKAddPaymentPassViewControllerDelegate>

@property (nonatomic, strong) PKAddPaymentPassViewController *viewController;
@property (nonatomic, strong) void (^onAddPaymentPassRequest)(PKAddPaymentPassRequest *request);
@property (nonatomic, strong) void (^resolve)(id result);
@property (nonatomic, strong) void (^reject)(NSString *, NSString *, NSError *);

@end

@implementation RNWallet

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (void)keepPromisePendingWithResolve:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject {
  if (_reject != nil) {
    _reject(@"wallet_error", @"Promise aborted by incoming new operation", nil);
  }
  _resolve = resolve;
  _reject = reject;
}

- (void)resolvePendingPromiseWithData:(id)data {
  if (_resolve != nil) {
    _resolve(data);
    _resolve = nil;
    _reject = nil;
  }
}

- (void)rejectPendingPromiseWithMessage:(NSString *)message {
  if (_reject != nil) {
    _reject(@"wallet_error", message, nil);
    _resolve = nil;
    _reject = nil;
  }
}

// https://stackoverflow.com/a/9084784
- (NSString *)dataToHex:(nonnull NSData *)data {
  const unsigned char *buffer = (const unsigned char *)[data bytes];

  if (!buffer) {
    return [NSString string];
  }

  NSUInteger length = [data length];
  NSMutableString *hex = [NSMutableString stringWithCapacity:(length * 2)];

  for (int i = 0; i < length; ++i) {
    [hex appendString:[NSString stringWithFormat:@"%02lx", (unsigned long)buffer[i]]];
  }

  return [NSString stringWithString:hex];
}

- (NSArray<PKPaymentPass *> *)paymentPasses {
  PKPassLibrary *passLibrary = [PKPassLibrary new];
  NSArray<PKPass *> *remotePasses = nil;

  if (@available(iOS 13.4, *)) {
    remotePasses = [passLibrary remoteSecureElementPasses];
  } else {
    remotePasses = [passLibrary remotePaymentPasses];
  }

  NSArray<PKPass *> *passes = [[passLibrary passes] arrayByAddingObjectsFromArray:remotePasses];
  NSMutableArray<PKPaymentPass *> *paymentPasses = [NSMutableArray array];

  for (PKPass *pass in passes) {
    PKPaymentPass * _Nullable paymentPass = [pass paymentPass];

    if (paymentPass != nil) {
      [paymentPasses addObject:paymentPass];
    }
  }

  return paymentPasses;
}

RCT_EXPORT_METHOD(getCards:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSMutableArray<NSDictionary *> *cards = [NSMutableArray array];
  PKPassLibrary *passLibrary = [PKPassLibrary new];

  for (PKPaymentPass *paymentPass in [self paymentPasses]) {
    NSURL * _Nullable passURL = [paymentPass passURL];
    bool canBeAdded = [PKAddPaymentPassViewController canAddPaymentPass];

    NSMutableDictionary *card = [[NSMutableDictionary alloc] initWithDictionary:@{
      @"lastFourDigits": [paymentPass primaryAccountNumberSuffix],
    }];

    if (passURL != nil) {
      NSString * _Nullable passURLOrToken = [passURL absoluteString];

      if (passURLOrToken != nil) {
        [card setObject:passURLOrToken forKey:@"passURLOrToken"];
      }
    }

    if (canBeAdded) {
      NSString *identifier = [paymentPass primaryAccountIdentifier];

      if (@available(iOS 13.4, *)) {
        canBeAdded = [passLibrary canAddSecureElementPassWithPrimaryAccountIdentifier:identifier];
      } else {
        canBeAdded = [passLibrary canAddPaymentPassWithPrimaryAccountIdentifier:identifier];
      }
    }

    [card setObject:@(canBeAdded) forKey:@"canBeAdded"];
    [cards addObject:card];
  }

  resolve(cards);
}

RCT_EXPORT_METHOD(getSignatureData:(NSDictionary *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return reject(@"wallet_error", @"Adding payment pass is not allowed", nil);
  }

  PKAddPaymentPassRequestConfiguration * _Nullable config = [[PKAddPaymentPassRequestConfiguration alloc] initWithEncryptionScheme:PKEncryptionSchemeECC_V2];

  if (config == nil) {
    return reject(@"wallet_error", @"Could not create configuration", nil);
  }

  NSString * _Nullable holderName = [data objectForKey:@"holderName"];
  NSString * _Nullable lastFourDigits = [data objectForKey:@"lastFourDigits"];

  if (holderName == nil || lastFourDigits == nil) {
    return reject(@"wallet_error", @"Input is not correctly formatted", nil);
  }

  [config setCardholderName:holderName];
  [config setPrimaryAccountSuffix:lastFourDigits];

  for (PKPaymentPass *paymentPass in [self paymentPasses]) {
    if ([lastFourDigits isEqualToString:[paymentPass primaryAccountNumberSuffix]]) {
      [config setPrimaryAccountIdentifier:[paymentPass primaryAccountIdentifier]];
    }
  }

  _viewController = [[PKAddPaymentPassViewController alloc] initWithRequestConfiguration:config delegate:self];

  if (_viewController == nil) {
    return reject(@"wallet_error", @"Could not create view controller", nil);
  }

  [self keepPromisePendingWithResolve:resolve reject:reject];

  [RCTPresentedViewController() presentViewController:_viewController animated:true completion:nil];
  [_viewController setDelegate:self];
}

- (void)addPaymentPassViewController:(nonnull PKAddPaymentPassViewController *)controller
 generateRequestWithCertificateChain:(nonnull NSArray<NSData *> *)certificates
                               nonce:(nonnull NSData *)nonce
                      nonceSignature:(nonnull NSData *)nonceSignature
                   completionHandler:(nonnull void (^)(PKAddPaymentPassRequest * _Nonnull))handler {
  NSMutableArray<NSDictionary *> *base64Certificates = [NSMutableArray array];

  for (int index = 0; index < [certificates count]; index++) {
    NSData *certificate = [certificates objectAtIndex:index];

    [base64Certificates addObject:@{
      @"key": index == 0 ? @"LEAF" : @"INTERMEDIATE",
      @"value": [certificate base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed]
    }];
  }

  NSDictionary *data = @{
    @"certificates": base64Certificates,
    @"nonce": [self dataToHex:nonce],
    @"nonceSignature": [self dataToHex:nonceSignature],
  };

  _onAddPaymentPassRequest = handler;
  [self resolvePendingPromiseWithData:data];
}

RCT_EXPORT_METHOD(addCard:(NSDictionary *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return reject(@"wallet_error", @"Adding payment pass is not allowed", nil);
  }

  NSString * _Nullable activationData = [data objectForKey:@"activationData"];
  NSString * _Nullable encryptedData = [data objectForKey:@"encryptedData"];
  NSString * _Nullable ephemeralPublicKey = [data objectForKey:@"ephemeralPublicKey"];

  if (activationData == nil || encryptedData == nil || ephemeralPublicKey == nil) {
    return reject(@"wallet_error", @"addCard input is not correctly formatted", nil);
  }

  PKAddPaymentPassRequest *request = [PKAddPaymentPassRequest new];

  [request setActivationData:[[NSData alloc] initWithBase64EncodedString:activationData options:NSDataBase64DecodingIgnoreUnknownCharacters]];
  [request setEncryptedPassData:[[NSData alloc] initWithBase64EncodedString:encryptedData options:NSDataBase64DecodingIgnoreUnknownCharacters]];
  [request setEphemeralPublicKey:[[NSData alloc] initWithBase64EncodedString:ephemeralPublicKey options:NSDataBase64DecodingIgnoreUnknownCharacters]];

  [self keepPromisePendingWithResolve:resolve reject:reject];
  _onAddPaymentPassRequest(request);
}

- (void)addPaymentPassViewController:(nonnull PKAddPaymentPassViewController *)controller
          didFinishAddingPaymentPass:(nullable PKPaymentPass *)pass
                               error:(nullable NSError *)error {
  if (_viewController != nil) {
    [RCTPresentedViewController() dismissViewControllerAnimated:true completion:^{
      self->_viewController = nil;
      self->_onAddPaymentPassRequest = nil;
    }];
  }

  bool success = error == nil;

  if (success || error.code == PKInvalidDataError) {
    [self resolvePendingPromiseWithData:@(success)];
  } else {
    [self rejectPendingPromiseWithMessage:[error localizedDescription]];
  }
}

RCT_EXPORT_METHOD(showCard:(NSString *)passURL
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSURL * _Nullable url = [[NSURL alloc] initWithString:passURL];

  if (url == nil) {
    return reject(@"wallet_error", @"Invalid pass URL", nil);
  }

  [[UIApplication sharedApplication] openURL:url
                                     options:@{}
                           completionHandler:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"wallet_error", @"Could not open pass", nil);
    }
  }];
}

@end

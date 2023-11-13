#import "RNWallet.h"

#import <PassKit/PassKit.h>
#import <React/RCTUtils.h>

@interface RNWallet() <PKAddPaymentPassViewControllerDelegate>

@property (nonatomic, strong) PKAddPaymentPassViewController *viewController;
@property (nonatomic, strong) void (^completionHandler)(PKAddPaymentPassRequest *request);
@property (nonatomic, strong) void (^resolve)(id result);

@end

@implementation RNWallet

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

// https://stackoverflow.com/a/9084784
- (NSString*)dataToHex:(nonnull NSData *)data {
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

RCT_EXPORT_METHOD(getCards:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return reject(@"wallet_error", @"Adding payment pass is not allowed", nil);
  }

  PKPassLibrary *passLibrary = [PKPassLibrary new];
  NSArray<PKPass *> *remotePasses = nil;

  if (@available(iOS 13.4, *)) {
    remotePasses = [passLibrary remoteSecureElementPasses];
  } else {
    remotePasses = [passLibrary remotePaymentPasses];
  }

  NSArray<PKPass *> *passes = [[passLibrary passes] arrayByAddingObjectsFromArray:remotePasses];
  NSMutableArray<NSDictionary *> *cards = [NSMutableArray array];

  for (PKPass *pass in passes) {
    PKPaymentPass * _Nullable paymentPass = [pass paymentPass];

    if (paymentPass == nil) {
      continue;
    }

    NSString * _Nullable identifier = [paymentPass primaryAccountIdentifier];
    NSString * _Nullable suffix = [paymentPass primaryAccountNumberSuffix];

    if (identifier == nil || suffix == nil) {
      continue;
    }

    NSMutableDictionary *card = [[NSMutableDictionary alloc] initWithDictionary:@{
      @"FPANSuffix": suffix,
      @"identifier": identifier,
    }];

    NSURL * _Nullable passURL = [pass passURL];

    if (passURL != nil) {
      NSString * _Nullable strPassURL = [passURL absoluteString];

      if (strPassURL != nil) {
        [card setObject:strPassURL forKey:@"passURL"];
      }
    }

    if (@available(iOS 13.4, *)) {
      [card setObject:@([passLibrary canAddSecureElementPassWithPrimaryAccountIdentifier:identifier]) forKey:@"canBeAdded"];
    } else {
      [card setObject:@([passLibrary canAddPaymentPassWithPrimaryAccountIdentifier:identifier]) forKey:@"canBeAdded"];
    }

    [cards addObject:card];
  }

  resolve(cards);
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

  NSString * _Nullable cardHolderName = [data objectForKey:@"cardHolderName"];
  NSString * _Nullable identifier = [data objectForKey:@"identifier"];
  NSString * _Nullable cardSuffix = [data objectForKey:@"cardSuffix"];

  if (cardHolderName == nil || cardSuffix == nil) {
    return reject(@"wallet_error", @"addCard input is not correctly formatted", nil);
  }

  [config setCardholderName:cardHolderName];
  [config setPrimaryAccountSuffix:cardSuffix];

  if (identifier != nil) {
    [config setPrimaryAccountIdentifier:identifier];
  }

  _viewController = [[PKAddPaymentPassViewController alloc] initWithRequestConfiguration:config delegate:self];

  if (_viewController == nil) {
    return reject(@"wallet_error", @"Could not create view controller", nil);
  }

  _resolve = resolve;

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

  _completionHandler = handler;

  if (_resolve != nil) {
    _resolve(data);
    _resolve = nil;
  }
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

  _resolve = resolve;
  _completionHandler(request);
}

- (void)addPaymentPassViewController:(nonnull PKAddPaymentPassViewController *)controller
          didFinishAddingPaymentPass:(nullable PKPaymentPass *)pass
                               error:(nullable NSError *)error {
  if (_viewController != nil) {
    [RCTPresentedViewController() dismissViewControllerAnimated:true completion:^{
      self->_viewController = nil;
      self->_completionHandler = nil;
    }];
  }

  if (_resolve != nil) {
    _resolve(@(error == nil));
    _resolve = nil;
  }
}

@end

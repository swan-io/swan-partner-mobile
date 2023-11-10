#import "RNWallet.h"

#import <PassKit/PassKit.h>
#import <React/RCTUtils.h>

@interface RNWallet() <PKAddPaymentPassViewControllerDelegate>

@property (nonatomic, strong) PKAddPaymentPassViewController *addPaymentPassViewController;
@property (nonatomic, strong) void (^completionHandler)(PKAddPaymentPassRequest *request);

@end

@implementation RNWallet {
  bool hasListeners;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onAddCardEvent"];
}

- (void)sendEvent:(nonnull NSString *)name
             data:(nonnull id)data {
  if (hasListeners) {
    [self sendEventWithName:@"onAddCardEvent" body:@{ @"name": name, @"data": data }];
  }
}

- (void)sendErrorEvent:(nonnull NSString *)message {
  [self sendEvent:@"error" data:message];
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

RCT_EXPORT_METHOD(openCard:(NSString *)passURL
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSURL * _Nullable url = [[NSURL alloc] initWithString:passURL];

  if (url == nil) {
    return reject(@"wallet_error", @"Invalid pass URL", nil);
  }

  [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"wallet_error", @"Could not open pass", nil);
    }
  }];
}

RCT_EXPORT_METHOD(addCard:(NSDictionary *)data) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return [self sendErrorEvent:@"Adding payment pass is not allowed"];
  }

  PKAddPaymentPassRequestConfiguration * _Nullable config = [[PKAddPaymentPassRequestConfiguration alloc] initWithEncryptionScheme:PKEncryptionSchemeECC_V2];

  if (config == nil) {
    return [self sendErrorEvent:@"Could not create configuration"];
  }

  NSString * _Nullable cardHolderName = [data objectForKey:@"cardHolderName"];
  NSString * _Nullable identifier = [data objectForKey:@"identifier"];
  NSString * _Nullable cardSuffix = [data objectForKey:@"cardSuffix"];

  if (cardHolderName == nil || cardSuffix == nil) {
    return [self sendErrorEvent:@"addCard input is not correctly formatted"];
  }

  [config setCardholderName:cardHolderName];
  [config setPrimaryAccountSuffix:cardSuffix];

  if (identifier != nil) {
    [config setPrimaryAccountIdentifier:identifier];
  }

  _addPaymentPassViewController = [[PKAddPaymentPassViewController alloc] initWithRequestConfiguration:config delegate:self];

  if (_addPaymentPassViewController == nil) {
    return [self sendErrorEvent:@"Could not create payment view"];
  }

  [RCTPresentedViewController() presentViewController:_addPaymentPassViewController animated:true completion:nil];
  _addPaymentPassViewController.delegate = self;
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
  [self sendEvent:@"signatureData" data:data];
}

RCT_EXPORT_METHOD(setInAppProvisioningData:(NSDictionary *)data) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return [self sendErrorEvent:@"Adding payment pass is not allowed"];
  }

  NSString * _Nullable activationData = [data objectForKey:@"activationData"];
  NSString * _Nullable encryptedData = [data objectForKey:@"encryptedData"];
  NSString * _Nullable ephemeralPublicKey = [data objectForKey:@"ephemeralPublicKey"];

  if (activationData == nil || encryptedData == nil || ephemeralPublicKey == nil) {
    return [self sendErrorEvent:@"setInAppProvisioningData input is not correctly formatted"];
  }

  PKAddPaymentPassRequest *request = [PKAddPaymentPassRequest new];

  [request setActivationData:[[NSData alloc] initWithBase64EncodedString:activationData options:NSDataBase64DecodingIgnoreUnknownCharacters]];
  [request setEncryptedPassData:[[NSData alloc] initWithBase64EncodedString:encryptedData options:NSDataBase64DecodingIgnoreUnknownCharacters]];
  [request setEphemeralPublicKey:[[NSData alloc] initWithBase64EncodedString:ephemeralPublicKey options:NSDataBase64DecodingIgnoreUnknownCharacters]];

  _completionHandler(request);
}

- (void)addPaymentPassViewController:(nonnull PKAddPaymentPassViewController *)controller
          didFinishAddingPaymentPass:(nullable PKPaymentPass *)pass
                               error:(nullable NSError *)error {
  if (_addPaymentPassViewController != nil) {
    [RCTPresentedViewController() dismissViewControllerAnimated:true completion:^{
      self->_addPaymentPassViewController = nil;
      self->_completionHandler = nil;
    }];
  }

  bool success = error == nil;

  if (success || error.code == PKInvalidDataError) {
    [self sendEvent:@"finished" data:@(success)];
  } else {
    [self sendErrorEvent:[error localizedDescription]];
  }
}

@end

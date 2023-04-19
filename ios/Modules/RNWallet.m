#import "RNWallet.h"

#import <PassKit/PassKit.h>
#import <React/RCTUtils.h>

@interface RNWallet() <PKAddPaymentPassViewControllerDelegate>

@property (nonatomic, strong) PKAddPaymentPassViewController *addPaymentPassViewController;
@property (nonatomic, strong) void (^ completionHandler)(PKAddPaymentPassRequest *request);

@end

@implementation RNWallet {
  bool hasListeners;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
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
  return @[@"addCardEvent"]; // addCardEvent
}

- (void)sendAddCardEvent:(nonnull NSString *)type
                    data:(nonnull NSDictionary *)data {
  if (hasListeners) {
    NSMutableDictionary *body = [[NSMutableDictionary alloc] initWithDictionary:data];
    [body setObject:type forKey:@"type"];
    [self sendEventWithName:@"addCardEvent" body:body];
  }
}

- (void)sendErrorEvent:(nonnull NSString *)message {
  [self sendAddCardEvent:@"error" data:@{ @"message": message }];
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

RCT_REMAP_METHOD(getCards,
                 getCardsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return reject(@"wallet_error", @"Adding payment pass is not allowed", nil);
  }

  NSArray<PKPass *> *remotePasses = nil;
  PKPassLibrary *lib = [PKPassLibrary new];

  if (@available(iOS 13.4, *)) {
    remotePasses = [lib remoteSecureElementPasses];
  } else {
    remotePasses = [lib remotePaymentPasses];
  }

  NSArray<PKPass *> *passes = [[lib passes] arrayByAddingObjectsFromArray:remotePasses];
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
      NSString * _Nullable strURL = [passURL absoluteString];

      if (strURL != nil)
        [card setObject:strURL forKey:@"passURL"];
    }

    if (@available(iOS 13.4, *)) {
      [card setObject:@([lib canAddSecureElementPassWithPrimaryAccountIdentifier:identifier]) forKey:@"canBeAdded"];
    } else {
      [card setObject:@([lib canAddPaymentPassWithPrimaryAccountIdentifier:identifier]) forKey:@"canBeAdded"];
    }

    [cards addObject:card];
  }

  resolve(cards);
}

RCT_REMAP_METHOD(openCardInWallet,
                 openCardInWalletWithPassURL:(NSString *)passURL
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
  NSMutableArray<NSString *> *strCertificates = [NSMutableArray array];

  // TODO: Add LEAF | INTERMEDIATE here
  for (NSData *data in certificates) {
    [strCertificates addObject:[data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed]];
  }

  NSDictionary *data = @{
    @"certificates": strCertificates,
    @"nonce": [self dataToHex:nonce],
    @"nonceSignature": [self dataToHex:nonceSignature],
  };

  _completionHandler  = handler;
  [self sendAddCardEvent:@"setCardInfos" data:data];
}

RCT_EXPORT_METHOD(setCardInfo:(NSDictionary *)info) {
  if (![PKAddPaymentPassViewController canAddPaymentPass]) {
    return [self sendErrorEvent:@"Adding payment pass is not allowed"];
  }

  NSString * _Nullable activationData = [info objectForKey:@"activationData"];
  NSString * _Nullable encryptedData = [info objectForKey:@"encryptedData"];
  NSString * _Nullable ephemeralPublicKey = [info objectForKey:@"ephemeralPublicKey"];

  if (activationData == nil || encryptedData == nil || ephemeralPublicKey == nil) {
    return [self sendErrorEvent:@"setCardInfo input is not correctly formatted"];
  }

  PKAddPaymentPassRequest *request = [PKAddPaymentPassRequest new];

  [request setActivationData:[[NSData alloc] initWithBase64EncodedString:activationData options:NSDataBase64DecodingIgnoreUnknownCharacters]];
  [request setEncryptedPassData:[[NSData alloc] initWithBase64EncodedString:encryptedData options:NSDataBase64DecodingIgnoreUnknownCharacters]];
  [request setEphemeralPublicKey:[[NSData alloc] initWithBase64EncodedString:ephemeralPublicKey options:NSDataBase64DecodingIgnoreUnknownCharacters]];

  self.completionHandler(request);
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

  if (error == nil) {
    return [self sendAddCardEvent:@"success" data:@{}];
  }

  if (error.code == PKInvalidDataError) {
    [self sendAddCardEvent:@"cancel" data:@{}];
  } else {
    [self sendErrorEvent:[error localizedDescription]];
  }
}

@end

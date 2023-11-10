#import "RNInAppBrowser.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

@import SafariServices;

@interface RNInAppBrowser() <SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate>

@property (nonatomic, strong) SFSafariViewController *safariViewController;

@end

@implementation RNInAppBrowser {
  bool hasListeners;
}

RCT_EXPORT_MODULE();

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
  return @[@"inAppBrowserDidClose"];
}

- (void)handleOnClose {
  _safariViewController = nil;

  if (hasListeners) {
    [self sendEventWithName:@"inAppBrowserDidClose" body:nil];
  }
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)controller {
  [self handleOnClose];
}

- (void)safariViewControllerDidFinish:(SFSafariViewController *)controller {
  [self handleOnClose];
}

RCT_EXPORT_METHOD(open:(NSString * _Nonnull)url
                  options:(NSDictionary * _Nonnull)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (_safariViewController != nil) {
    return reject(@"in_app_browser_visible", @"An instance of the in-app browser is already visible", nil);
  }

  @try {
    NSString *dismissButtonStyle = [options valueForKey:@"dismissButtonStyle"];
    NSNumber *barTintColor = [options valueForKey:@"barTintColor"];
    NSNumber *controlTintColor = [options valueForKey:@"controlTintColor"];

    SFSafariViewControllerConfiguration *config = [SFSafariViewControllerConfiguration new];
    [config setBarCollapsingEnabled:false];
    [config setEntersReaderIfAvailable:false];

    _safariViewController = [[SFSafariViewController alloc] initWithURL:[[NSURL alloc] initWithString:url] configuration:config];

    if (!dismissButtonStyle) {
      [_safariViewController setDismissButtonStyle:SFSafariViewControllerDismissButtonStyleDone];
    } else if ([dismissButtonStyle isEqualToString:@"cancel"]) {
      [_safariViewController setDismissButtonStyle:SFSafariViewControllerDismissButtonStyleCancel];
    } else if ([dismissButtonStyle isEqualToString:@"close"]) {
      [_safariViewController setDismissButtonStyle:SFSafariViewControllerDismissButtonStyleClose];
    }

    if (barTintColor) {
      [_safariViewController setPreferredBarTintColor:[RCTConvert UIColor:barTintColor]];
    }
    if (controlTintColor) {
      [_safariViewController setPreferredControlTintColor:[RCTConvert UIColor:controlTintColor]];
    }

    [_safariViewController setModalPresentationStyle:UIModalPresentationPageSheet];
    [RCTPresentedViewController() presentViewController:_safariViewController animated:true completion:nil];

    _safariViewController.delegate = self;
    _safariViewController.presentationController.delegate = self;

    resolve(nil);
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(close) {
  if (_safariViewController != nil) {
    [RCTPresentedViewController() dismissViewControllerAnimated:true completion:^{
      [self handleOnClose];
    }];
  }
}

@end

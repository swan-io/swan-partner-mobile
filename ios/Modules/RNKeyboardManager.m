#import "RNKeyboardManager.h"
#import <IQKeyboardManager/IQKeyboardManager.h>

@implementation RNKeyboardManager

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (instancetype)init {
  self = [super init];

  if (self) {
#if RCT_DEV
    [[IQKeyboardManager sharedManager] setEnableDebugging:true];
#endif

    [[IQKeyboardManager sharedManager] setEnable:true];
    [[IQKeyboardManager sharedManager] setShouldResignOnTouchOutside:YES];
    [[IQKeyboardManager sharedManager] setEnableAutoToolbar:NO];
    [[IQKeyboardManager sharedManager] setKeyboardDistanceFromTextField:10.0];
  }

  return self;
}

@end

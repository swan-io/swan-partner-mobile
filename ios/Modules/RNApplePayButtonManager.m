#import "RNApplePayButtonManager.h"
#import "RNApplePayButtonView.h"

@implementation RNApplePayButtonManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

- (UIView *) view {
  return [RNApplePayButtonView new];
}

@end

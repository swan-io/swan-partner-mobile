#import "RNApplePayButtonView.h"

#import <PassKit/PassKit.h>

@implementation RNApplePayButtonView {
  PKPaymentButton *_button;
}

- (instancetype) init {
  if (self = [super init]) {
    _button = [self setUpPaymentButton];
  }

  return self;
}

- (PKPaymentButton *)setUpPaymentButton {
  for (UIView *view in self.subviews) {
    [view removeFromSuperview];
  }

  PKPaymentButton *button = [[PKPaymentButton alloc] initWithPaymentButtonType:PKPaymentButtonTypeSetUp paymentButtonStyle:PKPaymentButtonStyleBlack];
  [button addTarget:self action:@selector(touchUpInside:) forControlEvents:UIControlEventTouchUpInside];

  [self addSubview:button];

  return button;
}

- (void)touchUpInside:(PKPaymentButton *)button {
  if (self.onPress) {
    self.onPress(nil);
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _button.frame = self.bounds;
}

@end

const e = require('cors');
const Pricing = require('../models/pricing_model');

// get time like  1:30 PM
function formatAMPM(date) {
  var currentOffset = date.getTimezoneOffset();
  var ISTOffset = 330; // IST offset UTC +5:30
  var ISTTime = new Date(date.getTime() + (ISTOffset + currentOffset) * 60000);
  // ISTTime now represents the time in IST coordinates
  var hoursIST = ISTTime.getHours();
  var hoursIST2 = ISTTime.getHours();
  var minutesIST = ISTTime.getMinutes();
  var secondsIST = ISTTime.getSeconds();
  hoursIST = hoursIST % 12;
  hoursIST = hoursIST ? hoursIST : 12; // the hour '0' should be '12'
  var ampm = hoursIST2 >= 12 ? 'PM' : 'AM';
  minutesIST = minutesIST < 10 ? '0' + minutesIST : minutesIST;
  secondsIST = secondsIST < 10 ? '0' + secondsIST : secondsIST;
  var str = hoursIST + ':' + minutesIST + ':' + secondsIST + ' ' + ampm;
  return str;
}

function timeConvertor(value) {
  var times = value;
  var split_time_ampm = times.split(' ');
  var time = split_time_ampm[0]; //'6:13:14'
  var ampm = split_time_ampm[1]; //'PM' or 'AM'
  var split_time = time.split(':');
  var hour = split_time[0];
  var min = split_time[1];
  if (ampm === 'PM' && hour < 12) hour = parseInt(hour) + 12;
  if (ampm === 'AM' && hour === 12) hour = parseInt(hour) + 12;
  var converted_time = parseInt(hour + min);
  return converted_time;
}

function convertorTimeFormat(value) {
  let time = value.split(' ');
  var properTimeFormat;
  if (time[1] === 'PM' || time[1] === 'AM') {
    properTimeFormat = time;
  } else {
    properTimeFormat = time[0] + time[1] + time[2] + ' ' + time[3];
  }
  return properTimeFormat;
}

module.exports = {
  getAmountfun: async (km, id, discount, minPrice, maxDiscount, time) => {
    console.log({ time });
    var payableAmount;
    var maxDiscountStatus = false;
    // find pricing Type
    const pricingType = await Pricing.findById(id).exec();
    if (pricingType) {
      let nightSurgeFromTime = timeConvertor(
        convertorTimeFormat(pricingType.nightSurgeTimeFrom)
      );
      let nightSurgeTimeTo = timeConvertor(
        convertorTimeFormat(pricingType.nightSurgeTimeTo)
      );
      let timeNow = timeConvertor(formatAMPM(new Date()));

      // night Surge
      if (timeNow >= nightSurgeFromTime && timeNow <= nightSurgeTimeTo) {
        console.log('STEP 1');
        // base range
        if (km <= pricingType.baseKM) {
          console.log('STEP 2');
          payableAmount = pricingType.baseFare + pricingType.nightSurgeCharge;
          let timeCalculate = time * pricingType.farePerMin
          console.log("e 1", time , pricingType.farePerMin, timeCalculate);
          if (pricingType.extraCharge > 0) {
            console.log('STEP 3');
            if (discount) {
              // apply discount base fare
              if (payableAmount >= minPrice) {
                var a, b;
                a = payableAmount * discount;
                b = a / 100;
                if (maxDiscount < b) {
                  payableAmount = payableAmount - maxDiscount;
                  b = maxDiscount;
                  maxDiscountStatus = true;
                } else {
                  payableAmount = payableAmount - b;
                }
                 
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + pricingType.nightSurgeCharge +  pricingType.extraCharge + timeCalculate,
                  nightSurgeCharge: pricingType.nightSurgeCharge,
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: pricingType.extraChargeReason,
                  appliedCoupon: true,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${discount}%`,
                  discount: b,
                  couponAppliedReason: `Successfully applied coupon`,
                  payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                };
              } else {
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                  nightSurgeCharge: pricingType.nightSurgeCharge,
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: pricingType.extraChargeReason,
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                  payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                };
              }
            } else {
              return {
                vehicletype: pricingType,
                amount: pricingType.baseFare + timeCalculate,
                nightSurgeCharge: pricingType.nightSurgeCharge,
                extraCharge: pricingType.extraCharge,
                extraChargeReason: pricingType.extraChargeReason,
                appliedCoupon: false,
                maxDiscountStatus: maxDiscountStatus,
                couponValue: `${0}%`,
                discount: 0,
                couponAppliedReason: ``,
                payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
              };
            }
          } else {
            if (discount) {
              // apply discount base fare
              if (payableAmount >= minPrice) {
                var a, b;
                a = payableAmount * discount;
                b = a / 100;
                if (maxDiscount < b) {
                  payableAmount = payableAmount - maxDiscount;
                  b = maxDiscount;
                  maxDiscountStatus = true;
                } else {
                  payableAmount = payableAmount - b;
                }
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + pricingType.nightSurgeCharge + timeCalculate,
                  nightSurgeCharge: pricingType.nightSurgeCharge,
                  extraCharge: 0,
                  extraChargeReason: ' ',
                  appliedCoupon: true,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${discount}%`,
                  discount: b,
                  couponAppliedReason: `Successfully applied coupon`,
                  payableAmount: payableAmount + timeCalculate,
                };
              } else {
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + pricingType.nightSurgeCharge + timeCalculate,
                  nightSurgeCharge: pricingType.nightSurgeCharge,
                  extraCharge: 0,
                  extraChargeReason: ' ',
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                  payableAmount: payableAmount + timeCalculate,
                };
              }
            } else {
              return {
                vehicletype: pricingType,
                amount: pricingType.baseFare,
                nightSurgeCharge: pricingType.nightSurgeCharge + timeCalculate,
                extraCharge: 0,
                extraChargeReason: ' ',
                appliedCoupon: false,
                maxDiscountStatus: maxDiscountStatus,
                couponValue: `${0}%`,
                discount: 0,
                couponAppliedReason: ``,
                payableAmount: payableAmount + timeCalculate,
              };
            }
          }
        }
        // range 1
        else {
          let temp = pricingType.maxKM1 - pricingType.minKM1;
          var range1_km = temp + 1;
          let KM = km - pricingType.baseKM;
          let timeCalculate = time * pricingType.farePerMin
          console.log("e 2", time , pricingType.farePerMin, timeCalculate);
          if (KM <= range1_km) {
            console.log('STEP 4');
            let totalAmount =
              KM * pricingType.fareBetweenRange1 + pricingType.baseFare;
            payableAmount = totalAmount + pricingType.nightSurgeCharge;
            if (pricingType.extraCharge > 0) {
              console.log('STEP 5');
              if (discount) {
                // apply discount on range 1
                if (payableAmount >= minPrice) {
                  var a, b;
                  a = payableAmount * discount;
                  b = a / 100;
                  if (maxDiscount < b) {
                    payableAmount = payableAmount - maxDiscount;
                    b = maxDiscount;
                    maxDiscountStatus = true;
                  } else {
                    payableAmount = payableAmount - b;
                  }
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: true,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${discount}%`,
                    discount: b,
                    couponAppliedReason: `Successfully applied Coupon`,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                }
              } else {
                return {
                  vehicletype: pricingType,
                  amount: totalAmount + timeCalculate ,
                  nightSurgeCharge: pricingType.nightSurgeCharge,
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: pricingType.extraChargeReason,
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: ``,
                  payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                };
              }
            } else {
              if (discount) {
                // apply discount on range 1
                if (payableAmount >= minPrice) {
                  var a, b;
                  a = payableAmount * discount;
                  b = a / 100;
                  if (maxDiscount < b) {
                    payableAmount = payableAmount - maxDiscount;
                    b = maxDiscount;
                    maxDiscountStatus = true;
                  } else {
                    payableAmount = payableAmount - b;
                  }
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: '',
                    appliedCoupon: true,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${discount}%`,
                    discount: b,
                    couponAppliedReason: `Successfully applied coupon`,
                    payableAmount: payableAmount + timeCalculate,
                  };
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: '',
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                    payableAmount: payableAmount + timeCalculate,
                  };
                }
              } else {
                return {
                  vehicletype: pricingType,
                  amount: totalAmount + timeCalculate,
                  nightSurgeCharge: pricingType.nightSurgeCharge,
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: '',
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: ``,
                  payableAmount: payableAmount + timeCalculate,
                };
              }
            }
          }
          // range 2
          else {
            let temp = pricingType.maxKM2 - pricingType.minKM2;
            var range2_km = temp + 1;
            let KM = km - pricingType.baseKM - range1_km;
            let timeCalculate = time * pricingType.farePerMin
            console.log("e 3", time , pricingType.farePerMin, timeCalculate);
            if (KM <= range2_km) {
              let nowFare = KM * pricingType.fareBetweenRange2;
              let fareRange1 = range1_km * pricingType.fareBetweenRange1;
              console.log('STEP 6');
              let totalAmount = nowFare + fareRange1 + pricingType.baseFare;
              payableAmount = totalAmount + pricingType.nightSurgeCharge;
              if (pricingType.extraCharge > 0) {
                console.log('STEP 7');
                if (discount) {
                  // apply discount on range 2 fare
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b = maxDiscount;
                      maxDiscountStatus = true;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge +pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `Successfully applied coupon`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                }
              } else {
                if (discount) {
                  // apply discount on range 2 fare
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b - maxDiscount;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge +pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: ' ',
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `Successfully applied coupon`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: ' ',
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount  + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: ' ',
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + timeCalculate,
                  };
                }
              }
            }
            // after range 2
            else {
              let KM = km - pricingType.baseKM - range2_km - range1_km;
              let nowFare = KM * pricingType.fareAfterRange2;
              let fareRange1 = range1_km * pricingType.fareBetweenRange1;
              let fareRange2 = range2_km * pricingType.fareBetweenRange2;
              let totalAmount =
                nowFare + pricingType.baseFare + fareRange1 + fareRange2;
              payableAmount = totalAmount + pricingType.nightSurgeCharge;
              let timeCalculate = time * pricingType.farePerMin
              console.log("e 4", time , pricingType.farePerMin, timeCalculate);
              if (pricingType.extraCharge > 0) {
                console.log('STEP 8');
                if (discount) {
                  // apply discount on after range 2
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (payableAmount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b = maxDiscount;
                      maxDiscountStatus = true;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `Successfully applied coupon`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                }
              } else {
                if (discount) {
                  // apply discount on after range 2
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b = maxDiscount;
                      maxDiscountStatus = true;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: '',
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `Successfully applied coupon`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.nightSurgeCharge + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: pricingType.nightSurgeCharge,
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: '',
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: pricingType.nightSurgeCharge,
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: '',
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + timeCalculate,
                  };
                }
              }
            }
          }
        }
      }
      //******************************************************** */
      else {
        // base range
        if (km <= pricingType.baseKM) {
          console.log('STEP 9');
          payableAmount = pricingType.baseFare;
          let timeCalculate = time * pricingType.farePerMin
          console.log("e 5", time , pricingType.farePerMin, timeCalculate);
          
          if (pricingType.extraCharge > 0) {
            console.log('STEP 10');
            if (discount) {
              // apply discount on nightsurge base fare
              if (payableAmount >= minPrice) {
                var a, b;
                a = payableAmount * discount;
                b = a / 100;
                if (maxDiscount < b) {
                  payableAmount = payableAmount - maxDiscount;
                  b = maxDiscount;
                  maxDiscountStatus = true;
                } else {
                  payableAmount = payableAmount - b;
                }
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + pricingType.extraCharge + timeCalculate,
                  nightSurgeCharge: '',
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: pricingType.extraChargeReason,
                  appliedCoupon: true,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${discount}%`,
                  discount: b,
                  couponAppliedReason: `Successfully Applied Coupon`,
                  payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                };
              } else {
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + pricingType.extraCharge + timeCalculate,
                  nightSurgeCharge: '',
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: pricingType.extraChargeReason,
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                  payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                };
              }
            } else {
              return {
                vehicletype: pricingType,
                amount: pricingType.baseFare + timeCalculate,
                nightSurgeCharge: '',
                extraCharge: pricingType.extraCharge,
                extraChargeReason: pricingType.extraChargeReason,
                appliedCoupon: false,
                maxDiscountStatus: maxDiscountStatus,
                couponValue: `${0}%`,
                discount: 0,
                couponAppliedReason: ``,
                payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
              };
            }
          } else {
            if (discount) {
              // apply discount on nightsurge base fare
              if (payableAmount >= minPrice) {
                var a, b;
                a = payableAmount * discount;
                b = a / 100;
                if (maxDiscount < b) {
                  payableAmount = payableAmount - maxDiscount;
                  b = maxDiscount;
                  maxDiscountStatus = true;
                } else {
                  payableAmount = payableAmount - b;
                }
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + timeCalculate,
                  nightSurgeCharge: '',
                  extraCharge: 0,
                  extraChargeReason: '',
                  appliedCoupon: true,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${discount}%`,
                  discount: b,
                  couponAppliedReason: `Successfully Applied`,
                  payableAmount: payableAmount + timeCalculate,
                };
              } else {
                return {
                  vehicletype: pricingType,
                  amount: pricingType.baseFare + timeCalculate,
                  nightSurgeCharge: '',
                  extraCharge: 0,
                  extraChargeReason: '',
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                  payableAmount: payableAmount + timeCalculate,
                };
              }
            } else {
              return {
                vehicletype: pricingType,
                amount: pricingType.baseFare + timeCalculate,
                nightSurgeCharge: '',
                extraCharge: 0,
                extraChargeReason: '',
                appliedCoupon: false,
                maxDiscountStatus: maxDiscountStatus,
                couponValue: `${0}%`,
                discount: 0,
                couponAppliedReason: ``,
                payableAmount: payableAmount + timeCalculate,
              };
            }
          }
        }
        // range 1
        else {
          let temp = pricingType.maxKM1 - pricingType.minKM1;
          var range1_km = temp + 1;
          let KM = km - pricingType.baseKM;
          if (KM <= range1_km) {
            let totalAmount =
              KM * pricingType.fareBetweenRange1 + pricingType.baseFare;
            payableAmount = totalAmount;
            let timeCalculate = time * pricingType.farePerMin
            console.log("e 6", time , pricingType.farePerMin, timeCalculate);
            if (pricingType.extraCharge > 0) {
              if (discount) {
                // apply discount on nightsurge on range 1
                if (payableAmount >= minPrice) {
                  var a, b;
                  a = payableAmount * discount;
                  b = a / 100;
                  if (maxDiscount < b) {
                    payableAmount = payableAmount - maxDiscount;
                    b = maxDiscount;
                    maxDiscountStatus = true;
                  } else {
                    payableAmount = payableAmount - b;
                  }
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount +pricingType.extraCharge + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: true,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${discount}%`,
                    discount: b,
                    couponAppliedReason: `Successfully applied Coupon`,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + pricingType.extraCharge+ timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                }
              } else {
                return {
                  vehicletype: pricingType,
                  amount: totalAmount + timeCalculate,
                  nightSurgeCharge: '',
                  extraCharge: pricingType.extraCharge,
                  extraChargeReason: pricingType.extraChargeReason,
                  appliedCoupon: false,
                  maxDiscountStatus: maxDiscountStatus,
                  couponValue: `${0}%`,
                  discount: 0,
                  couponAppliedReason: ``,
                  payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                };
              }
            } else {
              if (discount) {
                // apply discount on nightsurge on range 1
                if (payableAmount >= minPrice) {
                  var a, b;
                  a = payableAmount * discount;
                  b = a / 100;
                  if (maxDiscount < b) {
                    payableAmount = payableAmount - maxDiscount;
                    b = maxDiscount;
                    maxDiscountStatus = true;
                  } else {
                    payableAmount = payableAmount - b;
                  }

                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: 0,
                    extraChargeReason: '',
                    appliedCoupon: true,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${discount}%`,
                    discount: b,
                    couponAppliedReason: `Successfully applied Coupon`,
                    payableAmount: payableAmount + timeCalculate,
                  };
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: 0,
                    extraChargeReason: '',
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                    payableAmount: payableAmount + timeCalculate,
                  };
                }
              }
              return {
                vehicletype: pricingType,
                amount: totalAmount + timeCalculate,
                nightSurgeCharge: '',
                extraCharge: 0,
                extraChargeReason: '',
                appliedCoupon: false,
                maxDiscountStatus: maxDiscountStatus,
                couponValue: `${0}%`,
                discount: 0,
                couponAppliedReason: ``,
                payableAmount: payableAmount + timeCalculate,
              };
            }
          }
          // range 2
          else {
            let temp = pricingType.maxKM2 - pricingType.minKM2;
            var range2_km = temp + 1;
            let KM = km - pricingType.baseKM - range1_km;
            let timeCalculate = time * pricingType.farePerMin
            console.log("e 7", time , pricingType.farePerMin, timeCalculate);
            if (KM <= range2_km) {
              // console.log(KM, range2_km);
              let nowFare = KM * pricingType.fareBetweenRange2;
              let fareRange1 = range1_km * pricingType.fareBetweenRange1;
              let totalAmount = nowFare + fareRange1 + pricingType.baseFare;
              
              payableAmount = totalAmount;
              if (pricingType.extraCharge > 0) {
                if (discount) {
                  // apply discount on nightsurge range 2
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b = maxDiscount;
                      maxDiscountStatus = true;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `successfully applied coupon`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount+ pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                }
              } else {
                if (discount) {
                  // apply discount on nightsurge range 2
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b = maxDiscount;
                      maxDiscountStatus = true;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `successfully applied coupon`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: ' ',
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + timeCalculate,
                  };
                }
              }
            }
            // after range 2
            else {
              console.log('STEP 13');
              let KM = km - pricingType.baseKM - range2_km - range1_km;
              let nowFare = KM * pricingType.fareAfterRange2;
              let fareRange1 = range1_km * pricingType.fareBetweenRange1;
              let fareRange2 = range2_km * pricingType.fareBetweenRange2;
              let totalAmount =
                nowFare + pricingType.baseFare + fareRange1 + fareRange2;
              payableAmount = totalAmount;
              let timeCalculate = time * pricingType.farePerMin
              console.log("e 8", time , pricingType.farePerMin, timeCalculate);
              if (pricingType.extraCharge > 0) {
                if (discount) {
                  // apply discount on nightsurge after range 2
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b - maxDiscount;
                    } else {
                      payableAmount = payableAmount - b;
                    }

                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `Successfully applied coupon`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + pricingType.extraCharge + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: pricingType.extraCharge,
                      extraChargeReason: pricingType.extraChargeReason,
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                    };
                  }
                } else {
                  console.log('STEP 14');
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: pricingType.extraChargeReason,
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + pricingType.extraCharge + timeCalculate,
                  };
                }
              } else {
                if (discount) {
                  // apply discount nightsurge on after range2
                  if (payableAmount >= minPrice) {
                    var a, b;
                    a = payableAmount * discount;
                    b = a / 100;
                    if (maxDiscount < b) {
                      payableAmount = payableAmount - maxDiscount;
                      b = maxDiscount;
                      maxDiscountStatus = true;
                    } else {
                      payableAmount = payableAmount - b;
                    }
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: 0,
                      extraChargeReason: '',
                      appliedCoupon: true,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${discount}%`,
                      discount: b,
                      couponAppliedReason: `Successfully Applied Coupon`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  } else {
                    return {
                      vehicletype: pricingType,
                      amount: totalAmount + timeCalculate,
                      nightSurgeCharge: '',
                      extraCharge: 0,
                      extraChargeReason: '',
                      appliedCoupon: false,
                      maxDiscountStatus: maxDiscountStatus,
                      couponValue: `${0}%`,
                      discount: 0,
                      couponAppliedReason: `only coupon can add above Rs.${minPrice}`,
                      payableAmount: payableAmount + timeCalculate,
                    };
                  }
                } else {
                  return {
                    vehicletype: pricingType,
                    amount: totalAmount + timeCalculate,
                    nightSurgeCharge: '',
                    extraCharge: pricingType.extraCharge,
                    extraChargeReason: '',
                    appliedCoupon: false,
                    maxDiscountStatus: maxDiscountStatus,
                    couponValue: `${0}%`,
                    discount: 0,
                    couponAppliedReason: ``,
                    payableAmount: payableAmount + timeCalculate,
                  };
                }
              }
            }
          }
        }
      }
    } else {
      return {};
    }
  },
};

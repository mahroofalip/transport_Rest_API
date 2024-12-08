const Driver = require("../models/driver_model");
const Customer = require("../models/customer_model");
const admin = require("firebase-admin");
const ServiceAccount1 = require("./privateKey/privateKey.json");
const ServiceAccount2 = require("./privateKey/userPrivateKey.json");
const Fcm = require("../models/driver_app_fcm");

var defaultAppConfig = {
  //driver
  credential: admin.credential.cert(ServiceAccount1),
};
var secondAppConfig = {
  // user
  credential: admin.credential.cert(ServiceAccount2),
};
admin.initializeApp(defaultAppConfig);
let userApp = admin.initializeApp(secondAppConfig, "LoadRunnr User");
async function allUnRegistredSend(body, title, tokens) {
  let message = {
    notification: {
      title: title,
      body: body,
    },
    android: {
      ttl: 3600 * 1000,
      notification: {
        priority: "high",
        color: "#fd6204",
        icon: "@mipmap/truck",
        sound: "whistlesound.wav",
        channel_id: "high_importance_channel",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "tone.aiff",
        },
      },
    },
    tokens,
  };
  admin
    .messaging()
    .sendMulticast(message)
    .then(async (response) => {
      console.log(response);
      return null;
    })
    .catch((error) => {
      console.log("Error sending notification", error);
      return null;
    });
}
async function allUsersSend(body, title, tokens) {
  let message = {
    notification: {
      title: title,
      body: body,
    },

    android: {
      ttl: 3600 * 1000,
      notification: {
        priority: "high",
        color: "#fd6204",
        icon: "@mipmap/truck",
        sound: "tone.mp3",
        channel_id: "high_importance_channel",
      },
    },apns: {
      payload: {
        aps: {
          sound: "tone.aiff",
        },
      },
    },
    tokens,
  };

  admin
    .messaging(userApp)
    .sendMulticast(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
}
async function alldriverSend(body, title, tokens) {
  let message = {
    notification: {
      title: title,
      body: body,
    },

    android: {
      ttl: 3600 * 1000,
      notification: {
        priority: "high",
        color: "#fd6204",
        icon: "@mipmap/truck",
        sound: "whistlesound.wav",
        channel_id: "high_importance_channel",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "tone.aiff",
        },
      },
    },
    tokens,
  };
  admin
    .messaging()
    .sendMulticast(message)
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
}

module.exports = {
  orderNotification: async (data, bookingId) => {
    let convertedId = bookingId.toString();
    var fcmTokens = await data.driverFcm.filter(function (item) {
      if (data.oldDriversFcm.length !== 0) {
        return !data.oldDriversFcm.includes(item);
      } else {
        return item;
      }
    });

    if (fcmTokens.length !== 0) {
      let message = {
        notification: {
          title: `You have a order amount : ₹${data.amount}`,

          body: `${data.locations.pickupPoint.location} ➯ ${data.locations.dropPoint.location}`,
          // click_action:"FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          ttl: 3600 * 1000,
          notification: {
            priority: "high",
            color: "#fd6204",
            icon: "@mipmap/truck",
            sound: "whistlesound.wav",
            channel_id: "high_importance_channel",
          },
        },apns: {
          payload: {
            aps: {
              sound: "tone.aiff",
            },
          },
        },
        data: {
          bookingId: convertedId,
        },
        tokens: fcmTokens,
      };

      admin
        .messaging()
        .sendMulticast(message)
        .then((response) => {
          // console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
    }
  },

  cancelNotification: async (driverToken, orderId) => {
    let message = {
      notification: {
        title: `Your Order Has Been Cancelled`,
        body: `Order ID : ${orderId}`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "whistlesound.wav",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: driverToken,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  cancelUserNotification: async (driverToken, orderId) => {
    let message = {
      notification: {
        title: `Your Order Has Been Cancelled`,
        body: `Order ID : ${orderId}`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: driverToken,
    };

    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },

  approvalNotification: async (driverToken) => {
    let message = {
      notification: {
        title: `✅ Your LoadRunnr Partner Account Is Approved`,
        body: `Your Loadrunnr Partner Documents Have Been Verified, Start Accepting Orders & Earn Money ₹ ₹ ₹ 💰💰💰`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "whistlesound.wav",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: driverToken,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },

  allDriverNotification: async ({ body, title, tokens }) => {
    if (tokens.length !== 0) {
      for (let i = 0; i < tokens.length; i += 500) {
        const limitedTokens = tokens.slice(i, i + 500);
        alldriverSend(body, title, limitedTokens);
      }
    }
  },

  allUnRegisteredDriverNotification: async ({ body, title }) => {
    const result = await Fcm.findOne({ fcmFor: "driver" }).exec();
    let fcmRegistred = [];
    const regieredDrivers = await Driver.find();
    regieredDrivers.forEach((driver, i) => {
      fcmRegistred.push(driver.fcmToken);
    });
    var fcmTokens = result.fcmTokens.filter(function (item) {
      return !fcmRegistred.includes(item);
    });
    if (fcmTokens !== 0) {
      for (let i = 0; i < fcmTokens.length; i += 500) {
        const limitedTokens = fcmTokens.slice(i, i + 500);
        allUnRegistredSend(body, title, limitedTokens);
      }
    }
  },

  allUserNotification: async ({ body, title, tokens }) => {
    if (tokens.length !== 0) {
      for (let i = 0; i < tokens.length; i += 500) {
        const limitedTokens = tokens.slice(i, i + 500);
        allUsersSend(body, title, limitedTokens);
      }
    }
  },
  blockDriverNotification: async (token) => {
    let message = {
      notification: {
        title: `🛑 Your LoadRunnr Partner Account Is Blocked`,
        body: `Please contact our support team`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "whistlesound.wav",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  unBlockDriverNotification: async (token) => {
    let message = {
      notification: {
        title: `🟢 Your LoadRunnr Partner Account Is Unblocked`,
        body: `Your Loadrunnr Partner Documents Have Been  UnBloked `,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "whistlesound.wav",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  blockUserNotification: async (token) => {
    let message = {
      notification: {
        title: `🛑 Your LoadRunnr Account Is Blocked`,
        body: `Please contact our support team`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  unBlockUserNotification: async (token) => {
    let message = {
      notification: {
        title: `🟢 Your LoadRunnr Account Is Unblocked`,
        body: `Congratulation... `,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  assignedNotification: async (token, driver) => {
    let message = {
      notification: {
        title: `Delivery Partner ${driver.personalDetails.firstName} ${driver.personalDetails.lastName} Is On The Way To Pickup`,
        body: `Delivery Partner ${driver.personalDetails.firstName}" "${driver.personalDetails.lastName} With Vehicle No ${driver.vehicleDetails.vehicleNumber} Is On The Way To Pickup`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  reachedPickupNotification: async (token, otp) => {
    let message = {
      notification: {
        title: `${otp} Is Your Order Confirmation Pincode `,
        body: `Delivery Partner Reached Pick Up Point Confirm Your Order With Otp`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  pickedNotification: async (token, orderID) => {
    let message = {
      notification: {
        title: `Picked Order`,
        body: `Delivery Partner Picked Your order ${orderID}`,
      },

      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };

    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
  completedNotification: async (token, orderID) => {
    let message = {
      notification: {
        title: `Your Order is Completed`,
        body: `Your Order is Completed ${orderID}`,
      },
      android: {
        ttl: 3600 * 1000,
        notification: {
          priority: "high",
          color: "#fd6204",
          icon: "@mipmap/truck",
          sound: "tone.mp3",
          channel_id: "high_importance_channel",
        },
      },apns: {
        payload: {
          aps: {
            sound: "tone.aiff",
          },
        },
      },
      token: token,
    };
    admin
      .messaging(userApp)
      .send(message)
      .then((response) => {
        // console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },

  driverRejectionNotification: async (token, count) => {
    if (count === 1) {
      var message = {
        notification: {
          title: `❌Your Account Has Been Rejected`,
          body: `Your LoadRunnr Partner Account Has Been Rejected Click To Know More`,
        },

        android: {
          ttl: 3600 * 1000,
          notification: {
            priority: "high",
            color: "#fd6204",
            icon: "@mipmap/truck",
            sound: "whistlesound.wav",
            channel_id: "high_importance_channel",
          },
        },apns: {
          payload: {
            aps: {
              sound: "tone.aiff",
            },
          },
        },
        token: token,
      };
    } else if (count === 2) {
      var message = {
        notification: {
          title: `❌ನಿಮ್ಮ LoadRunnr ಪಾಲುದಾರ ಖಾತೆಯನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ`,
          body: `ನಿಮ್ಮ LoadRunnr ಪಾಲುದಾರ ಖಾತೆಯನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ತಿಳಿಯಲು ಕ್ಲಿಕ್ ಮಾಡಿ`,
        },

        android: {
          ttl: 3600 * 1000,
          notification: {
            priority: "high",
            color: "#fd6204",
            icon: "@mipmap/truck",
            sound: "whistlesound.wav",
            channel_id: "high_importance_channel",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "tone.aiff",
            },
          },
        },
        token: token,
      };
    }

    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  },
};

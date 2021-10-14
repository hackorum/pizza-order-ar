let tableNumber = null;
AFRAME.registerComponent("markerhandler", {
  init: async function () {
    if (!tableNumber) {
      this.askTableNumber();
    }
    //get the dishes collection from firestore database
    var dishes = await this.getDishes();

    //markerFound event
    this.el.addEventListener("markerFound", () => {
      if (tableNumber) {
        var markerId = this.el.id;
        this.handleMarkerFound(dishes, markerId);
      }
    });

    //markerLost event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askTableNumber: function () {
    let iconURL =
      "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "Welcome To The ARTEL",
      icon: iconURL,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your table number...",
          type: "number",
          min: 1,
        },
      },
      closeOnClickOutside: false,
    }).then((inputValue) => {
      tableNumber = inputValue;
    });
  },
  handleOrder: function (tNum, dish) {
    firebase
      .firestore()
      .collection("tables")
      .doc(tNum)
      .get()
      .then((doc) => {
        let details = doc.data();
        if (details["current_orders"][dish.id]) {
          details["current_orders"][dish.id]["quantity"] += 1;
          let currentQuantity = details["current_orders"][dish.id]["quantity"];
          details["current_orders"][dish.id]["subtotal"] =
            currentQuantity * dish.price;
        } else {
          details["current_orders"][dish.id] = {
            item: dish.dish_name,
            price: dish.price,
            quantity: 1,
            subtotal: dish.price,
          };
        }
        details.total_bill += dish.price;
        firebase.firestore().collection("tables").doc(doc.id).update(details);
      });
  },
  handleMarkerFound: function (dishes, markerId) {
    let date = new Date();
    let todaysDay = date.getDay();
    let days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    // Changing Model scale to initial scale
    let dish = dishes.filter((dish) => dish.id === markerId)[0];

    if (dish.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: dish.dish_name.toUpperCase(),
        text: "This dish is not available today!!!!",
        timer: 2500,
        buttons: false,
      });
    } else {
      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");

      // Handling Click Events
      if (tableNumber) {
        ratingButton.addEventListener("click", function () {
          swal({
            icon: "warning",
            title: "Rate Dish",
            text: "Work In Progress",
          });
        });

        orderButtton.addEventListener("click", () => {
          let tNum;
          tableNumber <= 9
            ? (tNum = `T0${tableNumber}`)
            : (tNum = `T${tableNumber}`);
          this.handleOrder(tNum, dish);
          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "Thanks For Order !",
            text: "Your order will serve soon on your table!",
          });
        });
      }

      let model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position);
      model.setAttribute("rotation", dish.model_geometry.rotation);
      model.setAttribute("scale", dish.model_geometry.scale);
      model.setAttribute("visible", true);

      let ingredientsContainer = document.querySelector(
        `#main-plane-${dish.id}`
      );
      ingredientsContainer.setAttribute("visible", true);
      let pricePlane = document.querySelector(`#price-plane-${dish.id}`);
      pricePlane.setAttribute("visible", true);
    }
  },

  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  },
  //get the dishes collection from firestore database
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("dishes")
      .get()
      .then((snap) => {
        return snap.docs.map((doc) => doc.data());
      });
  },
});

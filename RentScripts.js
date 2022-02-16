var Sdk = window.Sdk || {};
(
    function () {

        this.Rent_PickupDate_Change = function (executionContext) {
            var formContext = executionContext.getFormContext();
            var pickupDate = formContext.getAttribute("new_reservedpickup").getValue();
            if (pickupDate != null) {
                if (pickupDate < Date.now()) {
                    formContext.getControl("new_reservedpickup").setNotification("Pickup date can't be earlier than current date", "new_reservedpickup_msg");
                }
                else {
                    formContext.getControl("new_reservedpickup").clearNotification("new_reservedpickup_msg");
                }
            }
        }

        this.Rent_CheckEnableTransferReportButton = function (fieldReportId) {
            // true - button must be disable
            if (Xrm.Page.getAttribute(fieldReportId).getValue() != null) {
                return false;
            }
            else {
                return true;
            }
        }

        this.Rent_RibbonCreateTransferReport = function (recordId, strTransferType, intTransferType, fieldReportId, fieldActualdate, fieldReservedDate) {
            if (recordId == null) {
                Sdk.MessageBox("Please save changes before creating " + strTransferType +" report.");
            }
            else {
                if (!Sdk.Rent_CheckEnableTransferReportButton(fieldReportId)) {
                    Sdk.MessageBox(strTransferType+" report already created");
                    return;
                }
                var entityFormOptions = {};
                entityFormOptions["entityName"] = "new_cartransferreport";
                entityFormOptions["useQuickCreateForm"] = true;

                var formParameters = {};
                formParameters["new_carid"] = Xrm.Page.getAttribute("new_carid").getValue();
                formParameters["new_date"] = Xrm.Page.getAttribute(fieldReservedDate).getValue();
                formParameters["new_transfertype"] = intTransferType; 
                formParameters["new_description"] = strTransferType + " " + Xrm.Page.getAttribute("new_name").getValue() + " " + Xrm.Page.getAttribute(fieldReservedDate).getValue().toDateString();

                // Open the form.
                Xrm.Navigation.openForm(entityFormOptions, formParameters).then(
                    function (success) {
                        Xrm.Page.getAttribute(fieldReportId).setValue(success.savedEntityReference);
                        Xrm.Page.getAttribute(fieldActualdate).setValue(new Date());
                    },
                    function (error) {
                        //alert("error");
                    }
                );
            }
        }

        this.Rent_CheckEnablePickupReport = function () {
            return Sdk.Rent_CheckEnableTransferReportButton("new_pickupreportid");
        }

        this.Rent_CheckEnableReturnReport = function () {
            return Sdk.Rent_CheckEnableTransferReportButton("new_returnreport");
        }

        this.Rent_RibbonCreatePickupReport = function (recordId, primaryControl) {
            Sdk.Rent_RibbonCreateTransferReport(recordId, "Pickup", 100000001, "new_pickupreportid", "new_actualpickup", "new_reservedpickup");
        }

        this.Rent_RibbonCreateReturnReport = function (recordId, primaryControl) {
            Sdk.Rent_RibbonCreateTransferReport(recordId, "Return", 100000002, "new_returnreport", "new_actualreturn", "new_reservedhandover");
        }

        this.Rent_CalcPrice = function (executionContext) {
            var formContext = executionContext.getFormContext();

            var carClassArray = formContext.getAttribute("new_carclassid").getValue();
            var calcPrice = 0;

            if (carClassArray != null) {
                Xrm.WebApi.retrieveRecord("new_carclass", carClassArray[0].id, "?$select=new_price").then(
                    function success(result) {
                        calcPrice = result.new_price;
                        formContext.getControl("new_carclassid").clearNotification("new_carclass_msg");

                        if ((formContext.getAttribute("new_reservedhandover").getValue() == null)
                             || (formContext.getAttribute("new_reservedpickup").getValue() == null)) {
                            calcPrice = 0;
                        }
                        else {
                            calcPrice = Math.floor((Date.parse(formContext.getAttribute("new_reservedhandover").getValue()) -
                                Date.parse(formContext.getAttribute("new_reservedpickup").getValue())) / 1000 / 60 / 60 / 24) * Number(calcPrice);
                        }

                        if ((formContext.getAttribute("new_pickuplocation").getText() != "Office") && (formContext.getAttribute("new_pickuplocation").getText() != null)) {
                            calcPrice = calcPrice + 100;
                        }

                        if ((formContext.getAttribute("new_returnlocation").getText() != "Office") && (formContext.getAttribute("new_returnlocation").getText() != null)) {
                            calcPrice = calcPrice + 100;
                        }

                        formContext.getAttribute("new_price").setValue(calcPrice);
                    },
                    function (error) {
                        calcPrice = 0;
                        formContext.getControl("new_carclassid").setNotification("Can't find car rent price", "new_carclass_msg");
                        formContext.getAttribute("new_price").setValue(calcPrice);
                    }
                );
            }
            else {
                calcPrice = 0;
                formContext.getAttribute("new_price").setValue(calcPrice);
            };
        }

        this.MessageBox = function (msg) {
            Xrm.Navigation.openAlertDialog(msg).then(
                function (success) {
                },
                function (error) {
                }
            );

        }

    }
).call(Sdk);

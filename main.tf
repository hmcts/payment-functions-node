provider "azurerm" {
  version = "1.19.0"
}

/*locals {
  asp_resource_id = "${data.terraform_remote_state.shared_infra.app_service_plan_id}"
}*/

module "function_app" {
  source = "git@github.com:hmcts/ccpay-module-function?ref=master"
  env = "${var.env}"
  product = "${var.product}-${var.component}"
  ilbIp = "${var.ilbIp}"
  subscription = "${var.subscription}"
  location = "${var.location}"
  account_replication_type = "LRS"
  asp_resource_id = "${data.azurerm_app_service_plan.asp_resource_id.id}"
  common_tags = "${var.common_tags}"
  app_settings = {
    ServiceCallbackBusConnection="${data.terraform_remote_state.shared_infra.sb_primary_send_and_listen_connection_string}"
    RetrySchedule = "${var.retry_schedule}"
    ccpaybubble_microservice = "ccpay_bubble"
    s2s_key = "G5XTFNBUW4P6ZP4F"
    s2s_url = "http://rpe-service-auth-provider-aat.service.core-compute-aat.internal"
  }
}

data "azurerm_app_service_plan" "asp_resource_id" {
  name = "ccpay-${var.env}"
  resource_group_name = "ccpay-${var.env}"
}


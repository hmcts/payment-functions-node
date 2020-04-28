provider "azurerm" {
  version = "1.19.0"
}

locals {
  aseName = "core-compute-${var.env}"

  local_env = "${(var.env == "preview" || var.env == "spreview") ? (var.env == "preview" ) ? "aat" : "saat" : var.env}"
  local_ase = "${(var.env == "preview" || var.env == "spreview") ? (var.env == "preview" ) ? "core-compute-aat" : "core-compute-saat" : local.aseName}"
  s2sUrl = "http://rpe-service-auth-provider-${local.local_env}.service.${local.local_ase}.internal"
}

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
    microservice_payment_app = "payment_app"
    s2s_key_payment_app = "${data.azurerm_key_vault_secret.s2s_key_payment_app.value}"
    s2s_url = "${local.s2sUrl}"
  }
}

data "azurerm_app_service_plan" "asp_resource_id" {
  name = "ccpay-${var.env}"
  resource_group_name = "ccpay-${var.env}"
}

data "azurerm_key_vault_secret" "s2s_key_payment_app" {
  name      = "microservicekey-payment-app"
  vault_uri = "https://s2s-${var.env}.vault.azure.net/"
}

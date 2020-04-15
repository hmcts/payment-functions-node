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
    microservice_cmc = "cmc"
    microservice_divorce_frontend = "divorce_frontend"
    microservice_probate_frontend = "probate_frontend"
    s2s_key_cmc = "${data.azurerm_key_vault_secret.s2s_key_cmc.value}"
    s2s_key_divorce_frontend = "${data.azurerm_key_vault_secret.s2s_key_divorce_frontend.value}"
    s2s_key_probate_frontend = "${data.azurerm_key_vault_secret.s2s_key_probate_frontend.value}"
    s2s_url = "${local.s2sUrl}"
  }
}

data "azurerm_app_service_plan" "asp_resource_id" {
  name = "ccpay-${var.env}"
  resource_group_name = "ccpay-${var.env}"
}

data "azurerm_key_vault_secret" "s2s_key_cmc" {
  name      = "microservicekey-cmc"
  vault_uri = "https://s2s-${var.env}.vault.azure.net/"
}

data "azurerm_key_vault_secret" "s2s_key_divorce_frontend" {
  name      = "microservicekey-divorce-frontend"
  vault_uri = "https://s2s-${var.env}.vault.azure.net/"
}

data "azurerm_key_vault_secret" "s2s_key_probate_frontend" {
  name      = "microservicekey-probate-frontend"
  vault_uri = "https://s2s-${var.env}.vault.azure.net/"
}

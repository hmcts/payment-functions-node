locals {
  rg_name = "ccpay-${var.env}"
  func_app_name = "payment-node-${var.env}"
}

module "function_app" {
  source = "git@github.com:hmcts/ccpay-module-function?ref=master"
  env = "${var.env}"
  location = "${var.location}"
  resource_group_name = "${local.rg_name}"
  account_replication_type = "LRS"
  function_app_name = "${local.func_app_name}"
  plan_type = "dedicated"
  common_tags = "${var.common_tags}"
  app_settings = {
    ServiceCallbackBusConnection="${data.terraform_remote_state.shared_infra.sb_primary_send_and_listen_connection_string}"
  }
}

resource "null_resource" "funcDeployment" {
  # Just to ensure this gets run every time
  triggers {
    version = "${timestamp()}"
  }
  # set up source zip deployment
  provisioner "local-exec" {
    command = "bash -e ${path.module}/uploadSource.sh ${local.func_app_name} ${local.rg_name} functions ${var.subscription}"
  }
}

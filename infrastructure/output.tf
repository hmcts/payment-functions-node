output "funcapp_name" {
  description = "Function App name (identical with input parameter..for now)"
  value       = "${module.function_app.funcapp_name}"
}

output "funcapp_id" {
  description = "Function App unique ID"
  value       = "${module.function_app.funcapp_id}"
}

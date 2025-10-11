using System;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ThesisManagement.Api.Swagger
{
    /// <summary>
    /// Adds multipart/form-data support for actions which have [FromForm] IFormFile parameters and other form fields.
    /// </summary>
    public class FileUploadOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var formParams = context.ApiDescription.ParameterDescriptions
                .Where(p => p.Source != null && p.Source.Id == "Form")
                .ToList();

            if (!formParams.Any()) return;

            var schema = new OpenApiSchema { Type = "object", Properties = new System.Collections.Generic.Dictionary<string, OpenApiSchema>() };

            foreach (var p in formParams)
            {
                var name = p.Name ?? string.Empty;
                var type = p.Type ?? typeof(string);

                OpenApiSchema propertySchema;
                if (type == typeof(IFormFile) || type == typeof(Microsoft.AspNetCore.Http.IFormFile))
                {
                    propertySchema = new OpenApiSchema { Type = "string", Format = "binary" };
                }
                else if (type == typeof(int) || type == typeof(int?))
                {
                    propertySchema = new OpenApiSchema { Type = "integer", Format = "int32" };
                }
                else if (type == typeof(long) || type == typeof(long?))
                {
                    propertySchema = new OpenApiSchema { Type = "integer", Format = "int64" };
                }
                else if (type == typeof(DateTime) || type == typeof(DateTime?))
                {
                    propertySchema = new OpenApiSchema { Type = "string", Format = "date-time" };
                }
                else
                {
                    propertySchema = new OpenApiSchema { Type = "string" };
                }

                schema.Properties[name] = propertySchema;
                if (p.IsRequired)
                {
                    if (schema.Required == null) schema.Required = new System.Collections.Generic.HashSet<string>();
                    schema.Required.Add(name);
                }
            }

            operation.RequestBody = new OpenApiRequestBody
            {
                Content =
                {
                    ["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = schema
                    }
                }
            };
        }
    }
}

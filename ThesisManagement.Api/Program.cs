using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.Repositories;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Mappings;
using AutoMapper;
using Microsoft.OpenApi.Models;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // Allow credentials and reflect the incoming Origin header so browsers can send cookies.
        // Note: Don't use AllowAnyOrigin() together with AllowCredentials().
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ThesisManagement API", Version = "v1" });
    // Enable file upload support for multipart/form-data endpoints
    c.OperationFilter<ThesisManagement.Api.Swagger.FileUploadOperationFilter>();
});

// EF Core
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// Repositories / Services
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICodeGenerator, CodeGeneratorService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICommitteeAssignmentService, CommitteeAssignmentService>();

var app = builder.Build();

// Development: Swagger + Fake Admin user
if (app.Environment.IsDevelopment())
{
    // Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.DocumentTitle = "ThesisManagement API - Swagger";
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    });

    // Fake Admin identity for testing
    app.Use(async (context, next) =>
    {
        context.User = new ClaimsPrincipal(
            new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, "AdminDev"),
                new Claim(ClaimTypes.Role, "Admin")
            }, "DevBypass"));
        await next();
    });
}

app.UseHttpsRedirection();

// Ensure routing is set up so CORS can be applied to endpoints
app.UseRouting();

// Apply CORS early so it covers controller endpoints and static file responses
app.UseCors("AllowAll");

// Serve static files from wwwroot (so /uploads/{file} is accessible)
// Add OnPrepareResponse to ensure static file responses include CORS headers
app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var headers = ctx.Context.Response.Headers;
        var origin = ctx.Context.Request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin))
        {
            // Mirror the Origin to allow credentials
            headers.Append("Access-Control-Allow-Origin", origin);
            headers.Append("Access-Control-Allow-Credentials", "true");
        }
        else
        {
            // Fallback to wildcard for non-browser clients
            headers.Append("Access-Control-Allow-Origin", "*");
        }
        if (!headers.ContainsKey("Access-Control-Expose-Headers"))
            headers.Append("Access-Control-Expose-Headers", "Content-Disposition,Content-Length,Content-Type");
    }
});

app.UseAuthorization();

app.MapControllers();

app.Run();

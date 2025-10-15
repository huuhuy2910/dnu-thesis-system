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
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "ThesisManagement API", 
        Version = "v1" 
    });
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
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RugbyManagementSystem.Application.Interfaces;
using RugbyManagementSystem.Application.Services;
using RugbyManagementSystem.Domain.Entities;
using RugbyManagementSystem.Domain.Enums;
using RugbyManagementSystem.Infastructure.Data;
using RugbyManagementSystem.Infastructure.Repository;
using RugbyManagementSystem_Api.Middleware;
using System.Text;
using System.Text.Json.Serialization;


namespace RugbyManagementSystem_Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Keep API logging portable and avoid requiring Windows Event Log
            // source permissions when the app runs under a normal user account.
            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.AddDebug();


            builder.Services.AddScoped<TokenService>();

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };

        // TEMP: log the exact reason validation is failing
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"AUTH FAILED: {context.Exception.GetType().Name} - {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"CHALLENGE: {context.Error} - {context.ErrorDescription}");
                return Task.CompletedTask;
            }
        };
    });
            builder.Services.AddAuthorization();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Frontend", policy => policy
                    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:3000"])
                    .AllowAnyHeader()
                    .AllowAnyMethod());
            });


            // must come before other middleware

            // Controllers
            builder.Services.AddControllers()
        .AddJsonOptions(options =>
     {
         options.JsonSerializerOptions.ReferenceHandler =
          System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;

         options.JsonSerializerOptions.Converters.Add(
           new JsonStringEnumConverter());
     });

            // Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer"
                });

                options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("Bearer", document)] = []
                });
            });

            // Database
            builder.Services.AddDbContext<AppDbContext>(options =>
            {
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                if (builder.Configuration["DatabaseProvider"]?.Equals("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
                    options.UseSqlite(connectionString);
                else
                    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure());
            });

            // Application Services
            // Services
            builder.Services.AddScoped<IPlayerServices, PlayerServices>();
            builder.Services.AddScoped<IMatchServices, MatchServices>();
            builder.Services.AddScoped<IMatchPlayerServices, MatchPlayerService>();
            builder.Services.AddScoped<IUserServices, UserServices>();
            builder.Services.AddScoped<IFrontendAppService, FrontendAppService>();

            // Repositories
            builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
            builder.Services.AddScoped<IMatchRepository, MatchRepository>();
            builder.Services.AddScoped<IMatchPlayerRepository, MatchPlayerRepository>();
            builder.Services.AddScoped<IUserRepository, UserRpository>();

            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddProblemDetails();


            var app = builder.Build();

            app.UseExceptionHandler(); // must come before other middleware

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }



            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                if (db.Database.IsSqlite())
                    db.Database.EnsureCreated();
                else
                    db.Database.Migrate();

                if (app.Environment.IsDevelopment())
                {
                    var frontend = scope.ServiceProvider.GetRequiredService<IFrontendAppService>();
                    frontend.EnsureDevelopmentAdminAsync(
                        builder.Configuration["BootstrapAdmin:Username"] ?? string.Empty,
                        builder.Configuration["BootstrapAdmin:Email"] ?? string.Empty,
                        builder.Configuration["BootstrapAdmin:Password"] ?? string.Empty,
                        builder.Configuration["BootstrapAdmin:FullName"] ?? "Club Administrator").GetAwaiter().GetResult();
                }

            }


            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("Frontend");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.Run();
        }
    }
}

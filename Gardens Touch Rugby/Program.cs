using GTR.Application.Abstractions.Repositories;
using GTR.Application.Abstractions.Security;
using GTR.Application.Auth;
using GTR.Application.Matches;
using GTR.Application.Players;
using GTR.Infrastructure.Authentication;
using GTR.Infrastructure.Data;
using GTR.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.OpenApi;
using GTR.Application.Accounts;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection"
    )
    ?? throw new InvalidOperationException(
        "The DefaultConnection connection string is missing."
    );

var jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is missing."
    );

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer is missing."
    );

var jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience is missing."
    );

byte[] jwtKeyBytes;

try
{
    jwtKeyBytes = Convert.FromBase64String(jwtKey);
}
catch (FormatException)
{
    throw new InvalidOperationException(
        "Jwt:Key must be a valid Base64 value."
    );
}

if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must contain at least 32 bytes."
    );
}

var jwtExpiryMinutes =
    builder.Configuration.GetValue<int?>(
        "Jwt:ExpiryMinutes"
    ) ?? 120;

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options
        .UseNpgsql(connectionString)
        .EnableDetailedErrors();
});

builder.Services.Configure<JwtOptions>(options =>
{
    options.Key = jwtKey;
    options.Issuer = jwtIssuer;
    options.Audience = jwtAudience;
    options.ExpiryMinutes = jwtExpiryMinutes;
});

// Repositories
builder.Services.AddScoped<
    IPlayerRepository,
    PlayerRepository
>();

builder.Services.AddScoped<
    IMatchRepository,
    MatchRepository
>();

builder.Services.AddScoped<
    IAccountRepository,
    AccountRepository
>();

// Application services
builder.Services.AddScoped<
    IPlayerService,
    PlayerService
>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<
    IMatchService,
    MatchService
>();

builder.Services.AddScoped<
    IAuthService,
    AuthService
>();

// Security services
builder.Services.AddScoped<
    ITokenService,
    JwtTokenService
>();

builder.Services.AddScoped<DatabaseSeeder>();

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        jwtKeyBytes
                    ),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var seeder =
        scope.ServiceProvider
            .GetRequiredService<DatabaseSeeder>();

    await seeder.SeedAdminAsync(
     builder.Configuration["SeedAdmin:Username"],
     builder.Configuration["SeedAdmin:Password"]
 );
}

app.Run();
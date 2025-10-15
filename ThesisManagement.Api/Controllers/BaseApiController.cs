using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Services;
using System.Security.Claims;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        protected readonly IUnitOfWork _uow;
        protected readonly ICodeGenerator _codeGen;
        protected readonly IMapper _mapper;

        protected BaseApiController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper)
        {
            _uow = uow;
            _codeGen = codeGen;
            _mapper = mapper;
        }

        // Read role and userCode supplied by front-end in headers or query
        protected string? GetRequestRole()
        {
            if (Request.Headers.TryGetValue("X-User-Role", out var roleHeader)) return roleHeader.ToString();
                // Fallback to ClaimsPrincipal when header not provided (dev middleware or real authentication)
                if (User?.Identity != null && User.Identity.IsAuthenticated)
                {
                    var claim = User.FindFirst(ClaimTypes.Role) ?? User.FindFirst("role");
                    if (claim != null) return claim.Value;
                }
                if (Request.Query.ContainsKey("role")) return Request.Query["role"].ToString();
            return null;
        }

        protected string? GetRequestUserCode()
        {
            if (Request.Headers.TryGetValue("X-User-Code", out var codeHeader)) return codeHeader.ToString();
                // Use authenticated user's name or identifier if available
                if (User?.Identity != null && User.Identity.IsAuthenticated)
                {
                    var c = User.FindFirst(ClaimTypes.Name) ?? User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("userCode");
                    if (c != null) return c.Value;
                }
                if (Request.Query.ContainsKey("userCode")) return Request.Query["userCode"].ToString();
            return null;
        }
    }
}

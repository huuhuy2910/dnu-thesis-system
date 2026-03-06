using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Services;
using System.Security.Claims;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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

        // Read role and userCode from JWT claims; keep query fallback for backward-compatible filtering scenarios.
        protected string? GetRequestRole()
        {
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

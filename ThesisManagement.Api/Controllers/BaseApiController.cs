using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
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

        protected int CurrentUserId
        {
            get
            {
                var claim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return int.TryParse(claim, out var id) ? id : 0;
            }
        }

        protected string? GetRequestUserCode()
        {
            if (User?.Identity != null && User.Identity.IsAuthenticated)
            {
                var c = User.FindFirst("userCode") ?? User.FindFirst(ClaimTypes.Name) ?? User.FindFirst(ClaimTypes.NameIdentifier);
                if (c != null) return c.Value;
            }

            if (Request.Query.ContainsKey("userCode")) return Request.Query["userCode"].ToString();
            return null;
        }

        protected ActionResult<ApiResponse<T>> FromResult<T>(ApiResponse<T> result)
        {
            result.TraceId ??= HttpContext.TraceIdentifier;
            if (!Response.Headers.ContainsKey("X-API-Version"))
            {
                Response.Headers["X-API-Version"] = "2026-03";
            }

            var status = result.HttpStatusCode == 0
                ? (result.Success ? 200 : 400)
                : result.HttpStatusCode;
            return StatusCode(status, result);
        }
    }
}

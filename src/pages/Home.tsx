import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Home: React.FC = () => {
  const auth = useAuth();
  const [language, setLanguage] = useState<"VN" | "EN">("VN");

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffffff 0%, #fff8f3 50%, #ffe8d6 100%)",
      }}
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
          boxShadow: "0 2px 20px rgba(255, 107, 53, 0.1)",
          padding: "1rem 0",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(45deg, #FF6A00, #FF8A50)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                boxShadow: "0 2px 10px rgba(255, 106, 0, 0.3)",
              }}
            >
              🎓
            </div>
            <h1
              style={{
                color: "white",
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: "700",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              ĐẠI HỌC ĐẠI NAM
            </h1>
          </div>
          {/* Navigation Menu */}
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <a
              href="#about"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "500",
                transition: "opacity 0.3s ease",
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {language === "VN" ? "Giới thiệu" : "About"}
            </a>
            <a
              href="#guide"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "500",
                transition: "opacity 0.3s ease",
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {language === "VN" ? "Hướng dẫn" : "Guide"}
            </a>
            <a
              href="#notifications"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "500",
                transition: "opacity 0.3s ease",
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {language === "VN" ? "Thông báo" : "Notifications"}
            </a>
            <a
              href="#contact"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "500",
                transition: "opacity 0.3s ease",
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {language === "VN" ? "Liên hệ" : "Contact"}
            </a>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "VN" ? "EN" : "VN")}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                padding: "0.3rem 0.8rem",
                borderRadius: "15px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontWeight: "500",
                fontSize: "0.9rem",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
              }
            >
              {language}
            </button>

            {/* Auth Section */}
            {auth.isAuthenticated ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <span style={{ color: "white" }}>
                  {language === "VN" ? "Xin chào" : "Hello"},{" "}
                  {auth.user?.fullName ?? auth.user?.username}
                </span>
                <button
                  onClick={() => auth.logout()}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    padding: "0.5rem 1rem",
                    borderRadius: "25px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.2)")
                  }
                >
                  {language === "VN" ? "Đăng xuất" : "Logout"}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  textDecoration: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "25px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  transition: "all 0.3s ease",
                  fontWeight: "500",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.3)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.2)")
                }
              >
                {language === "VN" ? "Đăng nhập" : "Login"}
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        style={{
          background: `
            linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600"><defs><pattern id="wave" x="0" y="0" width="1000" height="600" patternUnits="userSpaceOnUse"><path d="M0,300 Q250,200 500,300 T1000,300 V600 H0 Z" fill="%23ff6b35" opacity="0.1"/><path d="M0,350 Q250,250 500,350 T1000,350 V600 H0 Z" fill="%23f7931e" opacity="0.1"/></pattern></defs><rect width="1000" height="600" fill="url(%23wave)"/></svg>')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "8rem 2rem 6rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Wave Effect */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100px",
            background:
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="%23FFFFFF"></path><path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="%23FFFFFF"></path><path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="%23FFFFFF"></path></svg>)',
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
            padding: "2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left Column - Text Content */}
          <div>
            <h1
              style={{
                fontSize: "3.5rem",
                marginBottom: "1rem",
                background: "linear-gradient(45deg, #FF6A00, #FF8A50)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: "700",
                fontFamily: "'Poppins', sans-serif",
                lineHeight: "1.2",
              }}
            >
              {language === "VN" ? "ĐẠI HỌC ĐẠI NAM" : "DAINAM UNIVERSITY"}
            </h1>
            <h2
              style={{
                fontSize: "2rem",
                marginBottom: "1.5rem",
                color: "#333333",
                fontWeight: "600",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {language === "VN"
                ? "Nền tảng quản lý đề tài & khóa luận (Nội bộ)"
                : "Thesis & Topic Management Platform (Internal)"}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                marginBottom: "2rem",
                color: "#6B7280",
                lineHeight: "1.6",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {language === "VN"
                ? "Nền tảng hỗ trợ sinh viên, giảng viên và ban chủ nhiệm trong quản lý đề tài: đăng ký, giao tiếp, theo dõi tiến độ và bảo vệ."
                : "Platform supporting students, lecturers and management board in topic management: registration, communication, progress tracking and defense."}
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "2rem",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/login"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(45deg, #FF6A00, #FF8A50)",
                  color: "white",
                  textDecoration: "none",
                  padding: "1rem 2rem",
                  borderRadius: "50px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 10px 30px rgba(255, 106, 0, 0.3)",
                  fontFamily: "'Poppins', sans-serif",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px rgba(255, 106, 0, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(255, 106, 0, 0.3)";
                }}
              >
                {language === "VN" ? "Đăng nhập" : "Login"}
              </Link>
              <button
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: "#FF6A00",
                  border: "2px solid #FF6A00",
                  textDecoration: "none",
                  padding: "1rem 2rem",
                  borderRadius: "50px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#FF6A00";
                  e.currentTarget.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#FF6A00";
                }}
              >
                {language === "VN" ? "Tìm hiểu nhanh" : "Quick Tour"}
              </button>
            </div>

            {/* Microcopy */}
            <p
              style={{
                color: "#6B7280",
                fontSize: "0.9rem",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {language === "VN"
                ? "Dành cho sinh viên • giảng viên • ban chủ nhiệm"
                : "For students • lecturers • management board"}
            </p>
          </div>

          {/* Right Column - Illustration */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "400px",
                margin: "0 auto",
                background:
                  'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23FF6A00;stop-opacity:0.1" /><stop offset="100%" style="stop-color:%23FF8A50;stop-opacity:0.1" /></linearGradient></defs><rect width="500" height="400" fill="url(%23grad)"/><circle cx="150" cy="150" r="40" fill="%23FF8A50" opacity="0.3"/><circle cx="350" cy="200" r="60" fill="%23FF6A00" opacity="0.2"/><rect x="100" y="250" width="300" height="100" rx="10" fill="%23FFF8F4" stroke="%23FF6A00" stroke-width="2"/><text x="250" y="310" text-anchor="middle" fill="%23333333" font-family="Poppins" font-size="18" font-weight="600">Thesis Management</text></svg>\')',
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "20px",
                boxShadow: "0 20px 40px rgba(255, 106, 0, 0.1)",
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        style={{
          padding: "6rem 2rem",
          background: "white",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                color: "#2d3748",
                fontWeight: "700",
              }}
            >
              {language === "VN" ? "Tính năng nổi bật" : "Key Features"}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#4a5568",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              {language === "VN"
                ? "Khám phá các công cụ mạnh mẽ giúp quản lý khóa luận hiệu quả"
                : "Discover powerful tools for effective thesis management"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
            }}
          >
            {/* Feature 1 */}
            <div
              style={{
                background: "white",
                border: "2px solid #ffe8d6",
                borderRadius: "20px",
                padding: "2rem",
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 4px 20px rgba(255, 107, 53, 0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(255, 107, 53, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(255, 107, 53, 0.1)";
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(45deg, #ff6b35, #f7931e)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "2rem",
                  boxShadow: "0 8px 25px rgba(255, 107, 53, 0.3)",
                }}
              >
                📝
              </div>
              <h3
                style={{
                  marginBottom: "1rem",
                  color: "#2d3748",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                }}
              >
                {language === "VN" ? "Quản lý đề tài" : "Topic Management"}
              </h3>
              <p
                style={{
                  color: "#4a5568",
                  lineHeight: "1.6",
                  fontSize: "0.95rem",
                }}
              >
                {language === "VN"
                  ? "Tạo, chỉnh sửa và theo dõi đề tài khóa luận một cách dễ dàng"
                  : "Create, edit and track thesis topics effortlessly"}
              </p>
            </div>

            {/* Feature 2 */}
            <div
              style={{
                background: "white",
                border: "2px solid #ffe8d6",
                borderRadius: "20px",
                padding: "2rem",
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 4px 20px rgba(255, 107, 53, 0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(255, 107, 53, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(255, 107, 53, 0.1)";
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(45deg, #059669, #10b981)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "2rem",
                  boxShadow: "0 8px 25px rgba(5, 150, 105, 0.3)",
                }}
              >
                👥
              </div>
              <h3
                style={{
                  marginBottom: "1rem",
                  color: "#2d3748",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                }}
              >
                {language === "VN" ? "Hợp tác nhóm" : "Team Collaboration"}
              </h3>
              <p
                style={{
                  color: "#4a5568",
                  lineHeight: "1.6",
                  fontSize: "0.95rem",
                }}
              >
                {language === "VN"
                  ? "Liên kết sinh viên và giảng viên hướng dẫn một cách hiệu quả"
                  : "Connect students and supervisors effectively"}
              </p>
            </div>

            {/* Feature 3 */}
            <div
              style={{
                background: "white",
                border: "2px solid #ffe8d6",
                borderRadius: "20px",
                padding: "2rem",
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 4px 20px rgba(255, 107, 53, 0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(255, 107, 53, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(255, 107, 53, 0.1)";
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(45deg, #3b82f6, #1d4ed8)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "2rem",
                  boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
                }}
              >
                📊
              </div>
              <h3
                style={{
                  marginBottom: "1rem",
                  color: "#2d3748",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                }}
              >
                {language === "VN" ? "Báo cáo thống kê" : "Progress Reports"}
              </h3>
              <p
                style={{
                  color: "#4a5568",
                  lineHeight: "1.6",
                  fontSize: "0.95rem",
                }}
              >
                {language === "VN"
                  ? "Theo dõi tiến độ và tạo báo cáo chi tiết về quá trình thực hiện"
                  : "Track progress and generate detailed reports on implementation"}
              </p>
            </div>

            {/* Feature 4 */}
            <div
              style={{
                background: "white",
                border: "2px solid #ffe8d6",
                borderRadius: "20px",
                padding: "2rem",
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 4px 20px rgba(255, 107, 53, 0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(255, 107, 53, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(255, 107, 53, 0.1)";
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(45deg, #dc2626, #ef4444)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "2rem",
                  boxShadow: "0 8px 25px rgba(220, 38, 38, 0.3)",
                }}
              >
                🔒
              </div>
              <h3
                style={{
                  marginBottom: "1rem",
                  color: "#2d3748",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                }}
              >
                {language === "VN" ? "Bảo mật dữ liệu" : "Data Security"}
              </h3>
              <p
                style={{
                  color: "#4a5568",
                  lineHeight: "1.6",
                  fontSize: "0.95rem",
                }}
              >
                {language === "VN"
                  ? "Đảm bảo an toàn và bảo mật thông tin cho tất cả người dùng"
                  : "Ensure safety and security of information for all users"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section
        id="notifications"
        style={{
          padding: "6rem 2rem",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                color: "#2d3748",
                fontWeight: "700",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {language === "VN"
                ? "Thông báo & Tin tức"
                : "Notifications & News"}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#4a5568",
                maxWidth: "600px",
                margin: "0 auto",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {language === "VN"
                ? "Cập nhật những thông tin quan trọng và tin tức mới nhất"
                : "Stay updated with important information and latest news"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "2rem",
              alignItems: "start",
            }}
          >
            {/* News List */}
            <div>
              <div
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "2rem",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>📢</span>
                  <div>
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#2d3748",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      {language === "VN"
                        ? "Hạn đăng ký đề tài: 30/11/2025"
                        : "Topic Registration Deadline: 30/11/2025"}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "#6B7280",
                        fontSize: "0.9rem",
                      }}
                    >
                      {language === "VN"
                        ? "Vui lòng hoàn thiện hồ sơ trước hạn."
                        : "Please complete your application before the deadline."}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "#FF6A00",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "15px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                    }}
                  >
                    URGENT
                  </span>
                  <span style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                    2 days ago
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "2rem",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>📅</span>
                  <div>
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#2d3748",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      {language === "VN"
                        ? "Lịch bảo vệ toàn khoa: 15/12/2025"
                        : "Faculty Defense Schedule: 15/12/2025"}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "#6B7280",
                        fontSize: "0.9rem",
                      }}
                    >
                      {language === "VN"
                        ? "Nộp báo cáo final trước 10/12/2025."
                        : "Submit final report before 10/12/2025."}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "#00B089",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "15px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                    }}
                  >
                    EVENT
                  </span>
                  <span style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                    1 week ago
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "2rem",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>🎓</span>
                  <div>
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#2d3748",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      {language === "VN"
                        ? "Workshop: Kỹ năng bảo vệ khóa luận"
                        : "Workshop: Thesis Defense Skills"}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "#6B7280",
                        fontSize: "0.9rem",
                      }}
                    >
                      {language === "VN"
                        ? "20/11/2025, Giảng đường A."
                        : "20/11/2025, Lecture Hall A."}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "15px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                    }}
                  >
                    NEWS
                  </span>
                  <span style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                    3 days ago
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Events Sidebar */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                height: "fit-content",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  color: "#2d3748",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                  textAlign: "center",
                }}
              >
                {language === "VN" ? "Sự kiện sắp tới" : "Upcoming Events"}
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #ffe8d6",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #fff8f3 0%, #ffe8d6 50%)",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    📅
                  </div>
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Hạn nộp báo cáo"
                      : "Report Submission"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.8rem",
                    }}
                  >
                    10/12/2025
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #d1fae5",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #f0fdf4 0%, #d1fae5 50%)",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    🎓
                  </div>
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN" ? "Lịch bảo vệ" : "Defense Schedule"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.8rem",
                    }}
                  >
                    15/12/2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section
        id="dashboard-preview"
        style={{
          padding: "6rem 2rem",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                color: "#2d3748",
                fontWeight: "700",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {language === "VN" ? "Xem trước Dashboard" : "Dashboard Preview"}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#4a5568",
                maxWidth: "600px",
                margin: "0 auto",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {language === "VN"
                ? "Khám phá giao diện quản lý của bạn"
                : "Explore your management interface"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            {/* Student Dashboard Preview */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                border: "2px solid #ffe8d6",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "15px",
                    background:
                      "linear-gradient(135deg, #FF6A00 0%, #ff8533 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  👨‍🎓
                </div>
                <div>
                  <h3
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "1.2rem",
                    }}
                  >
                    {language === "VN" ? "Sinh viên" : "Student"}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Quản lý đề tài cá nhân"
                      : "Personal topic management"}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN"
                      ? "Đề tài đã đăng ký:"
                      : "Registered topics:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>1</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN" ? "Trạng thái:" : "Status:"}
                  </span>
                  <span
                    style={{
                      color: "#FF6A00",
                      fontWeight: "600",
                      background: "#ffe8d6",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "10px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {language === "VN" ? "Đang chờ duyệt" : "Pending"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN" ? "Tiến độ:" : "Progress:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>
                    25%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "25%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #FF6A00 0%, #ff8533 100%)",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background:
                    "linear-gradient(135deg, #FF6A00 0%, #ff8533 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 5px 15px rgba(255, 106, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {language === "VN" ? "Xem chi tiết" : "View Details"}
              </button>
            </div>

            {/* Lecturer Dashboard Preview */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                border: "2px solid #d1fae5",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "15px",
                    background:
                      "linear-gradient(135deg, #00B089 0%, #00d4aa 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  👨‍🏫
                </div>
                <div>
                  <h3
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "1.2rem",
                    }}
                  >
                    {language === "VN" ? "Giảng viên" : "Lecturer"}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Quản lý hướng dẫn"
                      : "Supervision management"}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN"
                      ? "Sinh viên hướng dẫn:"
                      : "Students supervised:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>5</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN"
                      ? "Đề tài đang hướng dẫn:"
                      : "Active topics:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>3</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN"
                      ? "Báo cáo chờ duyệt:"
                      : "Reports pending:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>2</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "60%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #00B089 0%, #00d4aa 100%)",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background:
                    "linear-gradient(135deg, #00B089 0%, #00d4aa 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 5px 15px rgba(0, 176, 137, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {language === "VN" ? "Xem chi tiết" : "View Details"}
              </button>
            </div>

            {/* Admin Dashboard Preview */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                border: "2px solid #dbeafe",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "15px",
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  👨‍💼
                </div>
                <div>
                  <h3
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "1.2rem",
                    }}
                  >
                    {language === "VN" ? "Quản trị viên" : "Administrator"}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Quản lý hệ thống"
                      : "System administration"}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN" ? "Tổng đề tài:" : "Total topics:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>
                    127
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN"
                      ? "Người dùng hoạt động:"
                      : "Active users:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>
                    89
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.9rem" }}>
                    {language === "VN"
                      ? "Báo cáo tháng này:"
                      : "Reports this month:"}
                  </span>
                  <span style={{ color: "#2d3748", fontWeight: "600" }}>
                    23
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "85%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 5px 15px rgba(59, 130, 246, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {language === "VN" ? "Xem chi tiết" : "View Details"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section
        id="testimonials"
        style={{
          padding: "6rem 2rem",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                color: "#2d3748",
                fontWeight: "700",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {language === "VN" ? "Ý kiến từ người dùng" : "What Users Say"}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#4a5568",
                maxWidth: "600px",
                margin: "0 auto",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {language === "VN"
                ? "Trải nghiệm của sinh viên và giảng viên với hệ thống"
                : "Experiences from students and lecturers with the system"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "2rem",
            }}
          >
            {/* Testimonial 1 */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                position: "relative",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "2rem",
                  fontSize: "3rem",
                  color: "#FF6A00",
                  opacity: 0.2,
                }}
              >
                "
              </div>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#4a5568",
                  lineHeight: "1.6",
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                  paddingTop: "1rem",
                }}
              >
                {language === "VN"
                  ? "Hệ thống rất dễ sử dụng và giúp tôi theo dõi tiến độ đề tài một cách hiệu quả. Giao diện thân thiện và các tính năng thông báo rất hữu ích."
                  : "The system is very easy to use and helps me track my thesis progress effectively. The user-friendly interface and notification features are very helpful."}
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #FF6A00 0%, #ff8533 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  👨‍🎓
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "1rem",
                    }}
                  >
                    {language === "VN" ? "Nguyễn Văn A" : "Nguyen Van A"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Sinh viên CNTT"
                      : "Computer Science Student"}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  marginTop: "1rem",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    style={{ color: "#FF6A00", fontSize: "1.2rem" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Testimonial 2 */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                position: "relative",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "2rem",
                  fontSize: "3rem",
                  color: "#00B089",
                  opacity: 0.2,
                }}
              >
                "
              </div>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#4a5568",
                  lineHeight: "1.6",
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                  paddingTop: "1rem",
                }}
              >
                {language === "VN"
                  ? "Là giảng viên hướng dẫn, tôi đánh giá cao tính năng quản lý sinh viên và theo dõi tiến độ. Hệ thống giúp tôi dễ dàng phân công và đánh giá công việc."
                  : "As a supervising lecturer, I highly appreciate the student management and progress tracking features. The system makes it easy for me to assign and evaluate work."}
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00B089 0%, #00d4aa 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  👨‍🏫
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "1rem",
                    }}
                  >
                    {language === "VN" ? "TS. Trần Thị B" : "Dr. Tran Thi B"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Giảng viên Khoa CNTT"
                      : "Computer Science Lecturer"}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  marginTop: "1rem",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    style={{ color: "#00B089", fontSize: "1.2rem" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Testimonial 3 */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                position: "relative",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "2rem",
                  fontSize: "3rem",
                  color: "#3b82f6",
                  opacity: 0.2,
                }}
              >
                "
              </div>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#4a5568",
                  lineHeight: "1.6",
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                  paddingTop: "1rem",
                }}
              >
                {language === "VN"
                  ? "Hệ thống quản lý đề tài của Đại học Đại Nam rất chuyên nghiệp. Các tính năng báo cáo và thống kê giúp tôi nắm bắt được tổng quan về hoạt động nghiên cứu."
                  : "Đại học Đại Nam's thesis management system is very professional. The reporting and statistics features help me get an overview of research activities."}
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  👨‍💼
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem 0",
                      color: "#2d3748",
                      fontWeight: "600",
                      fontSize: "1rem",
                    }}
                  >
                    {language === "VN"
                      ? "PGS.TS. Lê Văn C"
                      : "Assoc. Prof. Le Van C"}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#6B7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    {language === "VN"
                      ? "Trưởng Khoa CNTT"
                      : "Head of Computer Science Department"}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  marginTop: "1rem",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    style={{ color: "#3b82f6", fontSize: "1.2rem" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
        style={{
          background: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
          color: "white",
          padding: "4rem 2rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          {/* About */}
          <div>
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.2rem",
                fontWeight: "600",
              }}
            >
              {language === "VN" ? "Về chúng tôi" : "About Us"}
            </h3>
            <p
              style={{
                color: "#a0aec0",
                lineHeight: "1.6",
                fontSize: "0.95rem",
              }}
            >
              {language === "VN"
                ? "Hệ thống quản lý khóa luận toàn diện, hỗ trợ sinh viên, giảng viên và nhà trường trong việc quản lý đề tài và theo dõi tiến độ."
                : "Comprehensive thesis management system, supporting students, lecturers and schools in topic management and progress tracking."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.2rem",
                fontWeight: "600",
              }}
            >
              {language === "VN" ? "Liên kết nhanh" : "Quick Links"}
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#about"
                  style={{
                    color: "#a0aec0",
                    textDecoration: "none",
                    fontSize: "0.95rem",
                    transition: "color 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ff6b35")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a0aec0")}
                >
                  {language === "VN" ? "Giới thiệu" : "About"}
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#features"
                  style={{
                    color: "#a0aec0",
                    textDecoration: "none",
                    fontSize: "0.95rem",
                    transition: "color 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ff6b35")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a0aec0")}
                >
                  {language === "VN" ? "Tính năng" : "Features"}
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#guide"
                  style={{
                    color: "#a0aec0",
                    textDecoration: "none",
                    fontSize: "0.95rem",
                    transition: "color 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ff6b35")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a0aec0")}
                >
                  {language === "VN" ? "Hướng dẫn" : "Guide"}
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  style={{
                    color: "#a0aec0",
                    textDecoration: "none",
                    fontSize: "0.95rem",
                    transition: "color 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ff6b35")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a0aec0")}
                >
                  {language === "VN" ? "Liên hệ" : "Contact"}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.2rem",
                fontWeight: "600",
              }}
            >
              {language === "VN" ? "Thông tin liên hệ" : "Contact Info"}
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                color: "#a0aec0",
                fontSize: "0.95rem",
              }}
            >
              <span>📧</span>
              <span>support@thesis.edu.vn</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                color: "#a0aec0",
                fontSize: "0.95rem",
              }}
            >
              <span>📞</span>
              <span>+84 123 456 789</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#a0aec0",
                fontSize: "0.95rem",
              }}
            >
              <span>📍</span>
              <span>
                {language === "VN"
                  ? "123 Đường ABC, Quận XYZ, TP.HCM"
                  : "123 ABC Street, XYZ District, HCMC"}
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            borderTop: "1px solid #4a5568",
            paddingTop: "2rem",
            textAlign: "center",
            color: "#a0aec0",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()}{" "}
            {language === "VN"
              ? "Hệ thống Quản lý Khóa luận"
              : "Thesis Management System"}
            .
            {language === "VN"
              ? " Được phát triển với ❤️ bởi đội ngũ phát triển."
              : " Developed with ❤️ by the development team."}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

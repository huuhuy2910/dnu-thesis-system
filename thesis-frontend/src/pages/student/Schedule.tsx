import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ScheduleEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "defense" | "meeting" | "presentation";
  description: string;
  participants?: string[];
}

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [events] = useState<ScheduleEvent[]>([
    {
      id: 1,
      title: "Bảo vệ đồ án tốt nghiệp",
      date: "2025-06-10",
      time: "09:00 - 11:00",
      location: "Phòng A201",
      type: "defense",
      description: "Bảo vệ đồ án tốt nghiệp trước hội đồng khoa",
      participants: ["PGS.TS Nguyễn Văn A", "TS. Trần Thị B", "ThS. Lê Văn C"],
    },
    {
      id: 2,
      title: "Họp hướng dẫn định kỳ",
      date: "2025-04-20",
      time: "14:00 - 15:30",
      location: "Phòng B102",
      type: "meeting",
      description: "Báo cáo tiến độ và trao đổi với giảng viên hướng dẫn",
      participants: ["TS. Nguyễn Văn A"],
    },
    {
      id: 3,
      title: "Thuyết trình tiến độ",
      date: "2025-05-05",
      time: "10:00 - 11:00",
      location: "Hội trường A",
      type: "presentation",
      description: "Thuyết trình tiến độ đồ án trước khoa",
      participants: ["Sinh viên năm cuối"],
    },
  ]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "defense":
        return { bg: "#dcfce7", border: "#22c55e", text: "#166534" };
      case "meeting":
        return { bg: "#fff5f0", border: "#f37021", text: "#9a3412" };
      case "presentation":
        return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" };
      default:
        return { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" };
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case "defense":
        return "Bảo vệ";
      case "meeting":
        return "Họp";
      case "presentation":
        return "Thuyết trình";
      default:
        return "Khác";
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const hasEvent = (date: Date) => {
    return events.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);
  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <CalendarIcon size={32} color="#f37021" />
          Lịch bảo vệ
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Xem lịch bảo vệ và các sự kiện liên quan đến đồ án
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* Calendar */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            border: "2px solid #f0f0f0",
          }}
        >
          {/* Calendar Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <button
              onClick={previousMonth}
              style={{
                padding: "8px",
                border: "none",
                background: "#f37021",
                color: "#fff",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <h2
              style={{ fontSize: "20px", fontWeight: "600", color: "#1a1a1a" }}
            >
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              style={{
                padding: "8px",
                border: "none",
                background: "#f37021",
                color: "#fff",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#666",
                    padding: "8px",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
              }}
            >
              {days.map((date, index) => (
                <div
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  style={{
                    minHeight: "80px",
                    padding: "8px",
                    border: date ? "1px solid #e5e7eb" : "none",
                    borderRadius: "8px",
                    backgroundColor: date
                      ? isToday(date)
                        ? "#fff5f0"
                        : hasEvent(date)
                        ? "#dcfce7"
                        : "#fff"
                      : "transparent",
                    cursor: date ? "pointer" : "default",
                    position: "relative",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (date) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (date) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  {date && (
                    <>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: isToday(date) ? "700" : "500",
                          color: isToday(date) ? "#f37021" : "#333",
                          marginBottom: "4px",
                        }}
                      >
                        {date.getDate()}
                      </div>
                      {hasEvent(date) && (
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: "#22c55e",
                            margin: "0 auto",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                background: "#fff5f0",
                border: "2px solid #f37021",
                borderRadius: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "12px",
                }}
              >
                Sự kiện ngày {selectedDate.getDate()}/
                {selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
              </h3>
              {getEventsForDate(selectedDate).length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {getEventsForDate(selectedDate).map((event) => {
                    const colors = getEventTypeColor(event.type);
                    return (
                      <div
                        key={event.id}
                        style={{
                          padding: "12px",
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                          }}
                        >
                          {event.title}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#666",
                            marginTop: "4px",
                          }}
                        >
                          {event.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#666" }}>
                  Không có sự kiện nào
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            border: "2px solid #f0f0f0",
            height: "fit-content",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock size={24} color="#f37021" />
            Sự kiện sắp tới
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {upcomingEvents.map((event) => {
              const colors = getEventTypeColor(event.type);
              return (
                <div
                  key={event.id}
                  style={{
                    padding: "16px",
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      backgroundColor: colors.border,
                      color: "#fff",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    {getEventTypeText(event.type)}
                  </span>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      marginBottom: "8px",
                    }}
                  >
                    {event.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    <CalendarIcon size={14} />
                    {new Date(event.date).toLocaleDateString("vi-VN")}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    <Clock size={14} />
                    {event.time}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    <MapPin size={14} />
                    {event.location}
                  </div>
                  {event.participants && event.participants.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: `1px solid ${colors.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        <Users size={14} />
                        Thành viên:
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#333",
                          paddingLeft: "20px",
                        }}
                      >
                        {event.participants.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;

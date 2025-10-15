import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Layers3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users2,
} from "lucide-react";
import { useToast } from "../../../context/useToast";
import { committeeAssignmentApi } from "../../../api/committeeAssignmentApi";
import { committeeService, type EligibleTopicSummary } from "../../../services/committee-management.service";
import type {
  CommitteeAssignmentAutoAssignCommittee,
  CommitteeAssignmentAutoAssignRequest,
  CommitteeAssignmentDefenseItem,
  CommitteeAssignmentListItem,
} from "../../../api/committeeAssignmentApi";

const PRIMARY_COLOR = "#1F3C88";
const ACCENT_COLOR = "#00B4D8";
const MUTED_BORDER = "#E2E8F0";
const CARD_SHADOW = "0 18px 40px rgba(31, 60, 136, 0.08)";

// (file continues identical to consolidated implementation)

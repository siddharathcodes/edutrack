import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search, Plus, Printer, ChevronDown, X, Pencil, Trash2,
  ArrowUpDown, CheckSquare, Square, Filter as FilterIcon, AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApplicationsAPI } from "../api/endpoints";
import { STAGE_ORDER, LEVELS, fmtDate } from "../constants";
import { useCountries } from "../hooks/useCountries";
import { PageHeader, Chip, LevelPill, StageTracker, IconBtn, Th, Td, btnPrimary, btnSecondary } from "../components/Shared";
import RecordModal from "../components/RecordModal";
import ConfirmDialog from "../components/ConfirmDialog";
import StageDateGrid from "../components/StageDateGrid";

export default function ApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeNames, flagFor } = useCountries();

  const visibleCountries = user.role === "admin" ? activeNames : user.countries || [];
  const activeCountry = searchParams.get("country") || "All";

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const [selected, setSelected] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | record
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // null | "bulk" | id
  const [deleting, setDeleting] = useState(false);
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const [toast, setToast] = useState(null);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  // Debounce search input so we don't hammer the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        sortBy: sortKey,
        sortDir,
        limit: 500,
      };
      if (activeCountry !== "All") params.country = activeCountry;
      if (stageFilter !== "All") params.stage = stageFilter;
      if (levelFilter !== "All") params.level = levelFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { rows, total } = await ApplicationsAPI.list(params);
      setRows(rows);
      setTotal(total);
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't load applications.");
    } finally {
      setLoading(false);
    }
  }, [activeCountry, stageFilter, levelFilter, debouncedSearch, dateFrom, dateTo, sortKey, sortDir]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const knownReferrers = useMemo(() => {
    const set = new Set();
    for (const r of rows) if (r.referredBy) set.add(r.referredBy);
    return [...set].sort();
  }, [rows]);

  function setActiveCountry(c) {
    if (c === "All") {
      searchParams.delete("country");
    } else {
      searchParams.set("country", c);
    }
    setSearchParams(searchParams);
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r._id))));
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (form._id) {
        await ApplicationsAPI.update(form._id, form);
        notify("Application updated");
      } else {
        await ApplicationsAPI.create(form);
        notify("Application added");
      }
      setEditing(null);
      loadRows();
    } catch (err) {
      notify(err.response?.data?.error || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkStage(stage) {
    setBulkStageOpen(false);
    try {
      const { modified } = await ApplicationsAPI.bulkUpdateStage([...selected], stage);
      notify(`${modified} application(s) moved to "${stage}"`);
      loadRows();
    } catch (err) {
      notify(err.response?.data?.error || "Bulk update failed.");
    }
  }

  async function handleDeleteConfirmed() {
    setDeleting(true);
    try {
      if (confirmDelete === "bulk") {
        const { deleted } = await ApplicationsAPI.bulkDelete([...selected]);
        notify(`${deleted} application(s) deleted`);
      } else {
        await ApplicationsAPI.remove(confirmDelete);
        notify("Application deleted");
      }
      setConfirmDelete(null);
      loadRows();
    } catch (err) {
      notify(err.response?.data?.error || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  function handlePrint(ids) {
    sessionStorage.setItem("edutrack_print_ids", JSON.stringify(ids));
    navigate("/print");
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <div>
      <PageHeader
        title={activeCountry === "All" ? "All applications" : `${flagFor(activeCountry)} ${activeCountry} applications`}
        subtitle={`${total} record${total !== 1 ? "s" : ""}${stageFilter !== "All" ? ` · ${stageFilter}` : ""}`}
        right={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handlePrint(rows.map((r) => r._id))} style={btnSecondary}>
              <Printer size={15} /> Print list
            </button>
            <button onClick={() => setEditing("new")} style={btnPrimary}>
              <Plus size={16} /> Add application
            </button>
          </div>
        }
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 360 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "#9AA4BD" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, course, provider, agent…"
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1px solid #E4DFD4", fontSize: 13.5, background: "#fff" }}
          />
        </div>
        <button onClick={() => setShowFilters((v) => !v)} style={{ ...btnSecondary, background: showFilters ? "#EFEAE0" : "#fff" }}>
          <FilterIcon size={14} /> Filters {(stageFilter !== "All" || levelFilter !== "All" || dateFrom || dateTo) && <Dot />}
        </button>
        {visibleCountries.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
            <Chip label="All" active={activeCountry === "All"} onClick={() => setActiveCountry("All")} />
            {visibleCountries.map((c) => (
              <Chip key={c} label={c} active={activeCountry === c} onClick={() => setActiveCountry(c)} />
            ))}
          </div>
        )}
      </div>

      {showFilters && (
        <div style={{ display: "flex", gap: 16, padding: "14px 16px", background: "#fff", border: "1px solid #E4DFD4", borderRadius: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <FilterSelect label="Stage" value={stageFilter} onChange={setStageFilter} options={["All", ...STAGE_ORDER]} />
          <FilterSelect label="Level" value={levelFilter} onChange={setLevelFilter} options={["All", ...LEVELS]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
            <span style={{ color: "#7A8299", fontWeight: 600 }}>Applied date range</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 13 }} />
              <span style={{ color: "#9AA4BD" }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 13 }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
            <span style={{ color: "#7A8299", fontWeight: 600 }}>Quick range</span>
            <div style={{ display: "flex", gap: 6 }}>
              <QuickRangeBtn label="This month" onClick={() => setMonthRange(0, setDateFrom, setDateTo)} />
              <QuickRangeBtn label="Last month" onClick={() => setMonthRange(-1, setDateFrom, setDateTo)} />
              <QuickRangeBtn label="Last 90 days" onClick={() => setDayRange(90, setDateFrom, setDateTo)} />
            </div>
          </div>
          {(stageFilter !== "All" || levelFilter !== "All" || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setStageFilter("All");
                setLevelFilter("All");
                setDateFrom("");
                setDateTo("");
              }}
              style={{ alignSelf: "flex-end", fontSize: 12.5, color: "#C44536", background: "none", border: "none", fontWeight: 600, paddingBottom: 8 }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#1B2A4A", borderRadius: 10, marginBottom: 14 }}>
          <span style={{ color: "#FAF8F3", fontSize: 13.5, fontWeight: 600 }}>{selected.size} selected</span>
          <div style={{ position: "relative" }}>
            <button onClick={() => setBulkStageOpen((v) => !v)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13 }}>
              Move to stage <ChevronDown size={13} />
            </button>
            {bulkStageOpen && (
              <div style={{ position: "absolute", top: "110%", left: 0, background: "#fff", border: "1px solid #E4DFD4", borderRadius: 8, boxShadow: "0 12px 28px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 180, overflow: "hidden" }}>
                {STAGE_ORDER.map((s) => (
                  <button key={s} onClick={() => handleBulkStage(s)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, border: "none", background: "#fff" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => handlePrint([...selected])} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13 }}>
            <Printer size={13} /> Print selected
          </button>
          <button onClick={() => setConfirmDelete("bulk")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #6B3B36", background: "transparent", color: "#F0A89F", fontSize: 13, fontWeight: 600 }}>
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: "#9AA4BD", fontSize: 13 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {error && <p style={{ color: "#C44536", marginBottom: 12 }}>{error}</p>}

      <div style={{ background: "#fff", border: "1px solid #E4DFD4", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto",scrollbarWidth: "none", msOverflowStyle: "none",} } className="hide-scrollbar">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAF8F3", borderBottom: "1px solid #E4DFD4" }}>
                <Th width={28}></Th>
                <Th width={40}>
                  <button onClick={toggleSelectAll} style={{ background: "none", border: "none", display: "flex" }}>
                    {allSelected ? <CheckSquare size={16} color="#E0922F" /> : <Square size={16} color="#B7BFD2" />}
                  </button>
                </Th>
                <SortTh label="Applicant" colKey="name" toggleSort={toggleSort} />
                {activeCountry === "All" && <SortTh label="Country" colKey="country" toggleSort={toggleSort} />}
                <SortTh label="Course / Provider" colKey="course" toggleSort={toggleSort} />
                <Th>Level</Th>
                <SortTh label="Applied" colKey="date" toggleSort={toggleSort} />
                <Th width={260}>Pipeline stage</Th>
                <Th width={140}>Referred by</Th>
                <Th width={70}></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <RowGroup
                  key={r._id}
                  record={r}
                  showCountry={activeCountry === "All"}
                  flagFor={flagFor}
                  selected={selected.has(r._id)}
                  expanded={expandedId === r._id}
                  onToggleSelect={() => toggleSelect(r._id)}
                  onToggleExpand={() => setExpandedId(expandedId === r._id ? null : r._id)}
                  onEdit={() => setEditing(r)}
                  onDeleteRequest={() => setConfirmDelete(r._id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9AA4BD" }}>
            <AlertTriangle size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No applications match these filters. Try clearing search or filters.</p>
          </div>
        )}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#9AA4BD", fontSize: 13.5 }}>Loading…</div>
        )}
      </div>

      {editing && (
        <RecordModal
          record={editing === "new" ? null : editing}
          visibleCountries={visibleCountries}
          defaultCountry={activeCountry !== "All" ? activeCountry : visibleCountries[0]}
          knownReferrers={knownReferrers}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={
            confirmDelete === "bulk"
              ? `Delete ${selected.size} selected application(s)? This can't be undone.`
              : `Delete this application? This can't be undone.`
          }
          confirming={deleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1B2A4A", color: "#FAF8F3", padding: "12px 22px", borderRadius: 8, fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(27,42,74,0.25)", zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function RowGroup({ record: r, showCountry, flagFor, selected, expanded, onToggleSelect, onToggleExpand, onEdit, onDeleteRequest }) {
  return (
    <>
      <tr style={{ borderBottom: expanded ? "none" : "1px solid #F1EDE3" }}>
        <Td>
          <button onClick={onToggleExpand} style={{ background: "none", border: "none", display: "flex", color: "#9AA4BD" }} title="Show all stage dates">
            <ChevronDown size={15} style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
          </button>
        </Td>
        <Td>
          <button onClick={onToggleSelect} style={{ background: "none", border: "none", display: "flex" }}>
            {selected ? <CheckSquare size={16} color="#E0922F" /> : <Square size={16} color="#B7BFD2" />}
          </button>
        </Td>
        <Td>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: 11.5, color: "#9AA4BD" }}>{r.intake ? `Intake: ${r.intake}` : ""}</div>
        </Td>
        {showCountry && <Td>{flagFor(r.country)} {r.country}</Td>}
        <Td>
          <div style={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.course}>{r.course || "—"}</div>
          <div style={{ fontSize: 11.5, color: "#9AA4BD", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.provider}>{r.provider || "—"}</div>
        </Td>
        <Td><LevelPill level={r.level} /></Td>
        <Td style={{ color: "#5B6478" }}>{fmtDate(r.date)}</Td>
        <Td><StageTracker stage={r.stage} /></Td>
        <Td style={{ color: "#5B6478" }}>{r.referredBy || "—"}</Td>
        <Td>
          <div style={{ display: "flex", gap: 4 }}>
            <IconBtn onClick={onEdit} title="Edit"><Pencil size={14} /></IconBtn>
            <IconBtn onClick={onDeleteRequest} title="Delete" danger><Trash2 size={14} /></IconBtn>
          </div>
        </Td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid #F1EDE3" }}>
          <Td /><Td />
          <Td colSpan={showCountry ? 8 : 7} style={{ background: "#FCFAF6", padding: "14px 14px 16px" }}>
            <StageDateGrid record={r} />
          </Td>
        </tr>
      )}
    </>
  );
}

function Dot() {
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0922F", display: "inline-block", marginLeft: 5 }} />;
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Sets dateFrom/dateTo to a full calendar month. offset=0 is the current month, -1 is last month, etc.
function setMonthRange(offset, setDateFrom, setDateTo) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  setDateFrom(toISODate(start));
  setDateTo(toISODate(end));
}

function setDayRange(days, setDateFrom, setDateTo) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  setDateFrom(toISODate(start));
  setDateTo(toISODate(end));
}

function QuickRangeBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #E4DFD4", background: "#fff", fontSize: 12, fontWeight: 600, color: "#3B445C" }}>
      {label}
    </button>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
      <span style={{ color: "#7A8299", fontWeight: 600 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 13, minWidth: 160, background: "#fff" }}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function SortTh({ label, colKey, toggleSort }) {
  return (
    <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em" }}>
      <button onClick={() => toggleSort(colKey)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "inherit", fontSize: "inherit", fontWeight: "inherit", textTransform: "inherit", padding: 0 }}>
        {label} <ArrowUpDown size={11} />
      </button>
    </th>
  );
}

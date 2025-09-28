import React, { useState } from "react";
import { Badge, Button, Card } from "./ui";
import { doc, updateDoc } from "firebase/firestore";
import { db , auth } from "@/firebase";
import styles from "./ProblemCard.module.css";

export default function ProblemCard({ problem, updateStatus }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: problem.title || "",
    difficulty: problem.difficulty || "Easy",
    status: problem.status || "Unsolved",
    topic: problem.topic || "",
    tags: Array.isArray(problem.tags) ? problem.tags.join(", ") : "",
    url: problem.url || "",
    video: problem.video || "",
    editorial: problem.editorial || "",
    notes: problem.notes || ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isOwner = problem.user === auth.currentUser?.uid;

  const saveProblem = async () => {
    if (!auth.currentUser) {
      alert("You must be logged in to save changes");
      return;
    }

    if (!isOwner) {
      alert("You can only edit your own problems");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedData = {
        title: formData.title.trim(),
        difficulty: formData.difficulty,
        status: formData.status,
        topic: formData.topic,
        tags: formData.tags
          ? formData.tags.split(",").map(t => t.trim()).filter(t => t)
          : [],
        url: formData.url.trim(),
        video: formData.video.trim(),
        editorial: formData.editorial.trim(),
        notes: formData.notes.trim(),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, "problems", problem.id), updatedData);
      setEditing(false);
    } catch (e) {
      console.error('Failed to save problem', e);
      setError(`Failed to save: ${e.message}`);
      alert(`Error saving problem: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    if (!auth.currentUser || !isOwner) return;
    updateStatus(problem.id, newStatus);
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy": return "success";
      case "Medium": return "warning";
      case "Hard": return "error";
      default: return "default";
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Get current status for display
  const currentStatus = editing ? formData.status : problem.status;

  return (
    <Card className={styles.problemCard}>
      {!editing ? (
        // View Mode
        <>
          <div className={styles.problemHeader}>
            <div className={styles.problemTitleContainer}>
              {isValidUrl(problem.url) ? (
                <a 
                  href={problem.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.problemTitle}
                >
                  {problem.title || "Untitled Problem"}
                </a>
              ) : (
                <span className={styles.problemTitle}>
                  {problem.title || "Untitled Problem"}
                </span>
              )}
              {problem.topic && (
                <Badge variant="default" className={styles.topicBadge}>
                  {problem.topic}
                </Badge>
              )}
            </div>
            <div className={styles.statusContainer}>
              <Badge variant={
                currentStatus === "Solved" ? "success" : 
                currentStatus === "Attempted" ? "warning" : "default"
              }>
                {currentStatus}
              </Badge>
              <Badge variant={getDifficultyColor(problem.difficulty)}>
                {problem.difficulty}
              </Badge>
            </div>
          </div>

          {problem.tags?.length > 0 && (
            <div className={styles.tagsContainer}>
              {problem.tags.map((tag, i) => (
                <Badge key={i} variant="default" className={styles.tagBadge}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className={styles.linksContainer}>
            {isValidUrl(problem.url) && (
              <a 
                href={problem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                📝 Problem
              </a>
            )}
            {isValidUrl(problem.video) && (
              <a 
                href={problem.video} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                🎥 Video
              </a>
            )}
            {isValidUrl(problem.editorial) && (
              <a 
                href={problem.editorial} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                📖 Editorial
              </a>
            )}
          </div>

          <div className={styles.notesSection}>
            <p className={styles.notesText}>
              {problem.notes || "No notes yet."}
            </p>
            {isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditing(true)}
                className={styles.editButton}
              >
                Edit
              </Button>
            )}
          </div>

          {/* Status update buttons */}
          {isOwner && (
            <div className={styles.statusButtons}>
              <Button 
                size="sm" 
                variant={currentStatus === "Solved" ? "success" : "outline"}
                onClick={() => handleStatusUpdate("Solved")}
                className={styles.statusButton}
              >
                ✅ Solved
              </Button>
              <Button 
                size="sm" 
                variant={currentStatus === "Attempted" ? "warning" : "outline"}
                onClick={() => handleStatusUpdate("Attempted")}
                className={styles.statusButton}
              >
                🔄 Attempted
              </Button>
              <Button 
                size="sm" 
                variant={currentStatus === "Unsolved" ? "secondary" : "outline"}
                onClick={() => handleStatusUpdate("Unsolved")}
                className={styles.statusButton}
              >
                ❓ Unsolved
              </Button>
            </div>
          )}
        </>
      ) : (
        // Edit Mode
        <div className={styles.editForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title *</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Difficulty</label>
            <select
              className={styles.formSelect}
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              disabled={saving}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Topic</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              placeholder="e.g., Graphs, Arrays, Dynamic Programming"
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tags (comma-separated)</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="Array, Two Pointers, Sorting"
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Problem URL</label>
            <input
              type="url"
              className={styles.formInput}
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              placeholder="https://leetcode.com/problems/example"
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Video Tutorial URL (optional)</label>
            <input
              type="url"
              className={styles.formInput}
              value={formData.video}
              onChange={(e) => setFormData({...formData, video: e.target.value})}
              placeholder="https://youtube.com/watch?v=example"
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Editorial URL (optional)</label>
            <input
              type="url"
              className={styles.formInput}
              value={formData.editorial}
              onChange={(e) => setFormData({...formData, editorial: e.target.value})}
              placeholder="https://leetcode.com/problems/example/solution"
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes / Approach</label>
            <textarea
              className={styles.formTextarea}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Your approach, key insights, or reminders..."
              disabled={saving}
            />
          </div>

          {error && (
            <p className={styles.errorMessage}>
              {error}
            </p>
          )}

          <div className={styles.formActions}>
            <Button 
              size="sm" 
              onClick={saveProblem}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { 
                setFormData({
                  title: problem.title || "",
                  difficulty: problem.difficulty || "Easy",
                  status: problem.status || "Unsolved",
                  topic: problem.topic || "",
                  tags: Array.isArray(problem.tags) ? problem.tags.join(", ") : "",
                  url: problem.url || "",
                  video: problem.video || "",
                  editorial: problem.editorial || "",
                  notes: problem.notes || ""
                });
                setEditing(false);
                setError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
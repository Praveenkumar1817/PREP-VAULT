// src/pages/ProblemDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import styles from "./ProblemDetail.module.css";

export default function ProblemDetail() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    difficulty: "Easy",
    status: "Unsolved",
    tags: "",
    url: "",
    video: "",
    editorial: "",
    notes: "",
    topic: ""
  });

  useEffect(() => {
    const fetchProblem = async () => {
      if (!auth.currentUser) {
        navigate("/sheets");
        return;
      }

      try {
        const problemDoc = doc(db, "problems", problemId);
        const problemSnap = await getDoc(problemDoc);
        
        if (!problemSnap.exists() || problemSnap.data().user !== auth.currentUser.uid) {
          navigate("/sheets");
          return;
        }
        
        const problemData = { id: problemSnap.id, ...problemSnap.data() };
        setProblem(problemData);
        setFormData({
          title: problemData.title || "",
          difficulty: problemData.difficulty || "Easy",
          status: problemData.status || "Unsolved",
          tags: Array.isArray(problemData.tags) ? problemData.tags.join(", ") : "",
          url: problemData.url || "",
          video: problemData.video || "",
          editorial: problemData.editorial || "",
          notes: problemData.notes || "",
          topic: problemData.topic || ""
        });
      } catch (err) {
        console.error("Error fetching problem:", err);
        navigate("/sheets");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  const saveProblem = async () => {
    if (!auth.currentUser || !problem) return;

    try {
      const problemDoc = doc(db, "problems", problemId);
      const updatedData = {
        title: formData.title.trim(),
        difficulty: formData.difficulty,
        status: formData.status,
        tags: formData.tags
          ? formData.tags.split(",").map(t => t.trim()).filter(t => t)
          : [],
        url: formData.url.trim(),
        video: formData.video.trim(),
        editorial: formData.editorial.trim(),
        notes: formData.notes.trim(),
        topic: formData.topic.trim(),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(problemDoc, updatedData);
      setProblem(prev => ({ ...prev, ...updatedData }));
      setEditing(false);
    } catch (err) {
      console.error("Error saving problem:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const updateStatus = async (status) => {
    if (!auth.currentUser || !problem) return;

    try {
      const problemDoc = doc(db, "problems", problemId);
      await updateDoc(problemDoc, { status });
      setProblem(prev => ({ ...prev, status }));
      setFormData(prev => ({ ...prev, status }));
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!problem) {
    return <div className={styles.notFound}>Problem not found</div>;
  }

  const getStatusSymbol = (status) => {
    switch (status) {
      case "Solved": return "✅";
      case "Attempted": return "🔄";
      case "Unsolved": return "❓";
      default: return "❓";
    }
  };

  return (
    <div className={styles.problemDetail}>
      <div className={styles.header}>
        <button 
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          ← Back
        </button>
        <h1 className={styles.pageTitle}>Problem Details</h1>
      </div>

      {!editing ? (
        // View Mode
        <div className={styles.problemView}>
          <div className={styles.problemHeader}>
            <h2 className={styles.problemTitle}>
              <a 
                href={problem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.titleLink}
              >
                {problem.title || "Untitled Problem"}
              </a>
            </h2>
            <div className={styles.problemMeta}>
              <span className={`${styles.difficultyBadge} ${problem.difficulty.toLowerCase()}`}>
                {problem.difficulty}
              </span>
              <span className={styles.topicBadge}>
                {problem.topic || "No topic"}
              </span>
            </div>
          </div>

          <div className={styles.statusSection}>
            <h3>Status</h3>
            <div className={styles.statusButtons}>
              <Button 
                variant={problem.status === "Solved" ? "success" : "outline"}
                onClick={() => updateStatus("Solved")}
              >
                {getStatusSymbol("Solved")} Solved
              </Button>
              <Button 
                variant={problem.status === "Attempted" ? "warning" : "outline"}
                onClick={() => updateStatus("Attempted")}
              >
                {getStatusSymbol("Attempted")} Attempted
              </Button>
              <Button 
                variant={problem.status === "Unsolved" ? "secondary" : "outline"}
                onClick={() => updateStatus("Unsolved")}
              >
                {getStatusSymbol("Unsolved")} Unsolved
              </Button>
            </div>
          </div>

          {problem.tags?.length > 0 && (
            <div className={styles.tagsSection}>
              <h3>Tags</h3>
              <div className={styles.tagsList}>
                {problem.tags.map((tag, i) => (
                  <span key={i} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.resourcesSection}>
            <h3>Resources</h3>
            <div className={styles.resourceLinks}>
              {problem.url && (
                <a 
                  href={problem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.resourceLink}
                >
                  📝 Problem
                </a>
              )}
              {problem.video && (
                <a 
                  href={problem.video} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.resourceLink}
                >
                  🎥 Video
                </a>
              )}
              {problem.editorial && (
                <a 
                  href={problem.editorial} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.resourceLink}
                >
                  📖 Editorial
                </a>
              )}
            </div>
          </div>

          <div className={styles.notesSection}>
            <h3>Notes</h3>
            <div className={styles.notesContent}>
              {problem.notes || "No notes added yet."}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button onClick={() => setEditing(true)}>Edit Problem</Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/sheets/${problem.sheetId}`)}
            >
              Back to Sheet
            </Button>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className={styles.problemEdit}>
          <h2>Edit Problem</h2>
          
          <div className={styles.formGroup}>
            <label>Problem URL *</label>
            <Input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Problem Title</label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Difficulty</label>
            <Select
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Select>
          </div>

          <div className={styles.formGroup}>
            <label>Topic</label>
            <Input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              placeholder="e.g., Sorting, Arrays, Dynamic Programming"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tags (comma-separated)</label>
            <Input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="Array, HashMap, Two Pointers"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Video Tutorial (optional)</label>
            <Input
              type="text"
              value={formData.video}
              onChange={(e) => setFormData({...formData, video: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Editorial (optional)</label>
            <Input
              type="text"
              value={formData.editorial}
              onChange={(e) => setFormData({...formData, editorial: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formActions}>
            <Button onClick={saveProblem}>Save Changes</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
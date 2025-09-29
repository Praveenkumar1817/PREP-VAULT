// src/pages/SheetDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, addDoc, updateDoc,deleteDoc, doc, getDoc } from "firebase/firestore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import styles from "./SheetDetail.module.css";

// Helper function to normalize topics
const normalizeTopic = (topic) => {
  if (!topic) return "";
  return topic.trim().charAt(0).toUpperCase() + topic.trim().slice(1).toLowerCase();
};

export default function SheetDetail() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [problems, setProblems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProblem, setNewProblem] = useState({
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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch sheet and problems
  useEffect(() => {
    const fetchSheetData = async () => {
      if (!auth.currentUser) return;

      try {
        const sheetRef = doc(db, "sheets", sheetId);
        const sheetDocSnap = await getDoc(sheetRef);
        
        if (!sheetDocSnap.exists() || sheetDocSnap.data().user !== auth.currentUser.uid) {
          navigate("/sheets");
          return;
        }
        
        setSheet({ id: sheetDocSnap.id, ...sheetDocSnap.data() });

        const problemsRef = collection(db, "problems");
        const problemsQuery = query(
          problemsRef,
          where("user", "==", auth.currentUser.uid),
          where("sheetId", "==", sheetId)
        );
        const problemsSnapshot = await getDocs(problemsQuery);
        const sheetProblems = problemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProblems(sheetProblems);
      } catch (err) {
        console.error("Error fetching sheet data:", err);
        navigate("/sheets");
      }
    };

    fetchSheetData();
  }, [sheetId]);

  const addProblem = async () => {
    if (!newProblem.title.trim()) {
      alert("Please enter a problem title");
      return;
    }

    setLoading(true);
    try {
      const problemsRef = collection(db, "problems");
      const problemData = {
        title: newProblem.title.trim(),
        difficulty: newProblem.difficulty,
        status: newProblem.status,
        tags: newProblem.tags
          ? newProblem.tags.split(",").map(t => t.trim()).filter(t => t)
          : [],
        url: newProblem.url.trim(),
        video: newProblem.video.trim(),
        editorial: newProblem.editorial.trim(),
        notes: newProblem.notes.trim(),
        user: auth.currentUser.uid,
        sheetId: sheetId,
        topic: newProblem.topic.trim(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(problemsRef, problemData);
      setProblems(prev => [...prev, { id: docRef.id, ...problemData }]);
      
      setNewProblem({
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
      setShowAddForm(false);
      navigate(`/problems/${docRef.id}`); // Navigate to problem detail
    } catch (err) {
      console.error("Error adding problem:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteProblem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) {
      return;
    }

    try {
      const problemDoc = doc(db, "problems", id);
      await deleteDoc(problemDoc);
      setProblems(problems.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting problem:", err);
      alert(`Failed to delete problem: ${err.message}`);
    }
  };

  const filteredProblems = problems.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (p.topic && p.topic.toLowerCase().includes(q))
    );
  });

  // Calculate progress
  const totalProblems = problems.length;
  const solvedProblems = problems.filter(p => p.status === "Solved").length;
  const progress = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

  // Get topic analytics
  const getTopicAnalytics = () => {
    const topicMap = new Map();
    
    problems.forEach(problem => {
      if (problem.topic) {
        const normalizedTopic = normalizeTopic(problem.topic);
        if (!topicMap.has(normalizedTopic)) {
          topicMap.set(normalizedTopic, { total: 0, solved: 0 });
        }
        const topicData = topicMap.get(normalizedTopic);
        topicData.total++;
        if (problem.status === "Solved") {
          topicData.solved++;
        }
      }
    });
    
    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      total: data.total,
      solved: data.solved,
      percentage: Math.round((data.solved / data.total) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
  };

  const topicAnalytics = getTopicAnalytics();

  if (!sheet) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.sheetDetail}>
      <div className={styles.header}>
        <div className={styles.sheetInfo}>
          <button 
            onClick={() => navigate("/sheets")}
            className={styles.backButton}
          >
            ← Back to Sheets
          </button>
          <h1 className={styles.sheetTitle}>{sheet.name}</h1>
          {sheet.description && (
            <p className={styles.sheetDescription}>{sheet.description}</p>
          )}
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressIcon}>
            <div className={styles.progressNumber}>
              {solvedProblems}/{totalProblems}
            </div>
          </div>
          <div className={styles.progressText}>
            {progress}% Complete
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchContainer}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.addButtons}>
          <Button onClick={() => setShowAddForm(true)} className={styles.addButton}>
            + Add Question
          </Button>
        </div>
      </div>

      {/* Add Problem Modal */}
      {showAddForm && (
        <div className={styles.modalOverlay} onClick={() => setShowAddForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Question to "{sheet.name}"</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.addForm}>
              <div className={styles.formGroup}>
                <label>Question URL *</label>
                <Input
                  type="text"
                  placeholder="e.g. https://leetcode.com/problems/two-sum"
                  className={styles.formInput}
                  value={newProblem.url}
                  onChange={(e) => setNewProblem({ ...newProblem, url: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Question Title (optional)</label>
                <Input
                  type="text"
                  placeholder="Optionally enter question title"
                  className={styles.formInput}
                  value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Difficulty</label>
                <select
                  className={styles.formSelect}
                  value={newProblem.difficulty}
                  onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Topic</label>
                <Input
                  type="text"
                  placeholder="e.g., Sorting, Arrays, Dynamic Programming"
                  className={styles.formInput}
                  value={newProblem.topic}
                  onChange={(e) => setNewProblem({ ...newProblem, topic: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tags (comma-separated)</label>
                <Input
                  type="text"
                  placeholder="Array, HashMap, Two Pointers"
                  className={styles.formInput}
                  value={newProblem.tags}
                  onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                />
              </div>

              <div className={styles.formActions}>
                <Button 
                  className={styles.saveButton}
                  onClick={addProblem}
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Question"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Analytics */}
      <div className={styles.analyticsSection}>
        <h2 className={styles.analyticsTitle}>Topic Analytics</h2>
        {topicAnalytics.length === 0 ? (
          <p className={styles.noAnalytics}>No topic data available yet.</p>
        ) : (
          <div className={styles.topicGrid}>
            {topicAnalytics.map((topicData, index) => (
              <div key={index} className={styles.topicCard}>
                <div className={styles.topicHeader}>
                  <h3 className={styles.topicName}>{topicData.topic}</h3>
                  <span className={styles.topicProgress}>
                    {topicData.percentage}%
                  </span>
                </div>
                <div className={styles.topicStats}>
                  <div className={styles.progressBarContainer}>
                    <div 
                      className={styles.progressBar}
                      style={{ width: `${topicData.percentage}%` }}
                    ></div>
                  </div>
                  <div className={styles.statsText}>
                    <span className={styles.solvedCount}>{topicData.solved} solved</span>
                    <span className={styles.totalCount}>{topicData.total} total</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Problem List - Simplified */}
      <div className={styles.problemListHeader}>
        <h2 className={styles.problemListTitle}>Questions ({filteredProblems.length})</h2>
      </div>
      
      {filteredProblems.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No questions in this sheet yet.</p>
          <Button onClick={() => setShowAddForm(true)}>
            Add Your First Question
          </Button>
        </div>
      ) : (
        <div className={styles.problemGrid}>
          {filteredProblems.map((p) => (
            <div key={p.id} className={styles.problemCard}>
              <div className={styles.problemCardContent}>
                <div className={styles.problemInfo}>
                  <h3 className={styles.problemTitle}>
                    <a 
                      href={p.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.problemLink}
                    >
                      {p.title || "Untitled Problem"}
                    </a>
                  </h3>
                  <div className={styles.problemMeta}>
                    <span className={styles.topic}>{p.topic || "No topic"}</span>
                    <span className={`${styles.difficultyBadge} ${p.difficulty.toLowerCase()}`}>
                      {p.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className={styles.problemActions}>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/problems/${p.id}`)}
                  >
                    View Details
                  </Button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => deleteProblem(p.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
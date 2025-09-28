// src/pages/SheetDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import ProblemCard from "../../components/ProblemCard";
import styles from "./SheetDetail.module.css";

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
        // Fetch sheet details
        const sheetRef = doc(db, "sheets", sheetId);
        const sheetDocSnap = await getDoc(sheetRef);
        
        if (!sheetDocSnap.exists() || sheetDocSnap.data().user !== auth.currentUser.uid) {
          navigate("/sheets");
          return;
        }
        
        setSheet({ id: sheetDocSnap.id, ...sheetDocSnap.data() });

        // Fetch problems for this sheet
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
        topic: newProblem.topic,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(problemsRef, problemData);
      setProblems(prev => [...prev, { id: docRef.id, ...problemData }]);
      
      // Reset form
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
    } catch (err) {
      console.error("Error adding problem:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!auth.currentUser) return;

    try {
      const problemDoc = doc(db, "problems", id);
      await updateDoc(problemDoc, { status });
      setProblems(problems.map(p => 
        p.id === id ? { ...p, status } : p
      ));
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const filteredProblems = problems.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  // Calculate progress
  const totalProblems = problems.length;
  const solvedProblems = problems.filter(p => p.status === "Solved").length;
  const progress = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

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
                <Select
                  className={styles.formSelect}
                  value={newProblem.difficulty}
                  onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
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
                  placeholder="e.g., Graphs, Arrays, Dynamic Programming"
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

              <div className={styles.formGroup}>
                <label>Video Tutorial (optional)</label>
                <Input
                  type="text"
                  placeholder="YouTube link"
                  className={styles.formInput}
                  value={newProblem.video}
                  onChange={(e) => setNewProblem({ ...newProblem, video: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Editorial (optional)</label>
                <Input
                  type="text"
                  placeholder="Official solution link"
                  className={styles.formInput}
                  value={newProblem.editorial}
                  onChange={(e) => setNewProblem({ ...newProblem, editorial: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Notes / Approach (optional)</label>
                <textarea
                  placeholder="Your approach, key insights, or reminders..."
                  className={styles.formTextarea}
                  value={newProblem.notes}
                  onChange={(e) => setNewProblem({ ...newProblem, notes: e.target.value })}
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

      {/* Problem List */}
      <div className={styles.problemList}>
        {filteredProblems.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions in this sheet yet.</p>
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Question
            </Button>
          </div>
        ) : (
          filteredProblems.map((p) => (
            <ProblemCard key={p.id} problem={p} updateStatus={updateStatus} />
          ))
        )}
      </div>
    </div>
  );
}
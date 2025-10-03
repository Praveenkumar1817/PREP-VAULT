import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc,
  deleteDoc
} from "firebase/firestore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import ProblemCard from "../../components/ProblemCard";
import styles from "./Problems.module.css";

export default function Problems() {
  const [sheets, setSheets] = useState([]);
  const [problems, setProblems] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [newSheet, setNewSheet] = useState({ name: "", description: "" });
  const [newProblem, setNewProblem] = useState({
    title: "",
    difficulty: "Easy",
    status: "Unsolved",
    tags: "",
    url: "",
    video: "",
    editorial: "",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        const sheetsRef = collection(db, "sheets");
        const sheetsQuery = query(sheetsRef, where("user", "==", auth.currentUser.uid));
        const sheetsSnapshot = await getDocs(sheetsQuery);
        const userSheets = sheetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSheets(userSheets);

        if (userSheets.length > 0 && !activeSheet) {
          setActiveSheet(userSheets[0]);
        }

        if (activeSheet) {
          const problemsRef = collection(db, "problems");
          const problemsQuery = query(
            problemsRef, 
            where("user", "==", auth.currentUser.uid),
            where("sheetId", "==", activeSheet.id)
          );
          const problemsSnapshot = await getDocs(problemsQuery);
          const sheetProblems = problemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProblems(sheetProblems);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      }
    };

    fetchData();
  }, [activeSheet]);

  const createSheet = async () => {
    if (!newSheet.name.trim()) {
      alert("Please enter a sheet name");
      return;
    }

    if (!auth.currentUser) {
      alert("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const sheetsRef = collection(db, "sheets");
      const sheetData = {
        name: newSheet.name.trim(),
        description: newSheet.description.trim(),
        user: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(sheetsRef, sheetData);
      const newSheetObj = { id: docRef.id, ...sheetData };
      
      setSheets(prev => [...prev, newSheetObj]);
      setActiveSheet(newSheetObj);
      setShowSheetModal(false);
      setNewSheet({ name: "", description: "" });
    } catch (err) {
      console.error("Error creating sheet:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addProblem = async () => {
    if (!newProblem.title.trim()) {
      alert("Please enter a problem title");
      return;
    }

    if (!activeSheet) {
      alert("Please select or create a sheet first");
      return;
    }

    if (!auth.currentUser) {
      alert("You must be logged in");
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
        sheetId: activeSheet.id,
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
      });
      setShowProblemModal(false);
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

  const deleteSheet = async (sheetId) => {
    if (!window.confirm("Are you sure you want to delete this sheet? All problems in it will be deleted too.")) {
      return;
    }

    try {
      const problemsRef = collection(db, "problems");
      const problemsQuery = query(
        problemsRef,
        where("user", "==", auth.currentUser.uid),
        where("sheetId", "==", sheetId)
      );
      const problemsSnapshot = await getDocs(problemsQuery);
      
      const deletePromises = problemsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, "sheets", sheetId));
      
      const updatedSheets = sheets.filter(s => s.id !== sheetId);
      setSheets(updatedSheets);
      
      if (activeSheet?.id === sheetId) {
        setActiveSheet(updatedSheets.length > 0 ? updatedSheets[0] : null);
        setProblems([]);
      }
    } catch (err) {
      console.error("Error deleting sheet:", err);
      alert(`Error: ${err.message}`);
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

  return (
    <div className={styles.problems}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Problem Sheets</h2>
        <Button 
          onClick={() => setShowSheetModal(true)}
          className={styles.addButton}
        >
          + New Sheet
        </Button>
      </div>

      <div className={styles.sheetsNav}>
        {sheets.length === 0 ? (
          <p className={styles.noSheets}>No sheets created yet.</p>
        ) : (
          <div className={styles.sheetsList}>
            {sheets.map(sheet => (
              <div 
                key={sheet.id} 
                className={`${styles.sheetItem} ${activeSheet?.id === sheet.id ? styles.active : ''}`}
                onClick={() => setActiveSheet(sheet)}
              >
                <div className={styles.sheetInfo}>
                  <h4 className={styles.sheetName}>{sheet.name}</h4>
                  {sheet.description && (
                    <p className={styles.sheetDescription}>{sheet.description}</p>
                  )}
                </div>
                <div className={styles.sheetActions}>
                  <span className={styles.problemCount}>
                    {problems.filter(p => p.sheetId === sheet.id).length} problems
                  </span>
                  <button 
                    className={styles.deleteSheetBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSheet(sheet.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSheet && (
        <>
          <div className={styles.sheetHeader}>
            <h3 className={styles.activeSheetName}>{activeSheet.name}</h3>
            <Button 
              onClick={() => setShowProblemModal(true)}
              className={styles.addProblemBtn}
            >
              + Add Problem
            </Button>
          </div>

          <div className={styles.searchContainer}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search problems in this sheet..."
              className={styles.searchInput}
            />
            <Button onClick={() => setSearchTerm('')} variant="outline">Clear</Button>
          </div>

          <div className={styles.problemList}>
            {filteredProblems.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No problems in this sheet.</p>
                <Button onClick={() => setShowProblemModal(true)}>
                  Add Your First Problem
                </Button>
              </div>
            ) : (
              filteredProblems.map((p) => (
                <ProblemCard key={p.id} problem={p} updateStatus={updateStatus} />
              ))
            )}
          </div>
        </>
      )}

      {showSheetModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSheetModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create New Sheet</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSheetModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.addForm}>
              <Input
                type="text"
                placeholder="Sheet name *"
                className={styles.formInput}
                value={newSheet.name}
                onChange={(e) => setNewSheet({ ...newSheet, name: e.target.value })}
              />
              
              <Input
                type="text"
                placeholder="Description (optional)"
                className={styles.formInput}
                value={newSheet.description}
                onChange={(e) => setNewSheet({ ...newSheet, description: e.target.value })}
              />

              <div className={styles.formActions}>
                <Button 
                  className={styles.saveButton}
                  onClick={createSheet}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Sheet"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowSheetModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProblemModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProblemModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Problem to "{activeSheet?.name}"</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowProblemModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.addForm}>
              <Input
                type="text"
                placeholder="Problem title *"
                className={styles.formInput}
                value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              />

              <Select
                className={styles.formSelect}
                value={newProblem.difficulty}
                onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>

              <Input
                type="text"
                placeholder="Comma-separated tags (e.g., Array, HashMap)"
                className={styles.formInput}
                value={newProblem.tags}
                onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
              />

              <Input
                type="text"
                placeholder="Problem URL (LeetCode/CF/etc)"
                className={styles.formInput}
                value={newProblem.url}
                onChange={(e) => setNewProblem({ ...newProblem, url: e.target.value })}
              />

              <Input
                type="text"
                placeholder="Video link (optional)"
                className={styles.formInput}
                value={newProblem.video}
                onChange={(e) => setNewProblem({ ...newProblem, video: e.target.value })}
              />

              <Input
                type="text"
                placeholder="Editorial link (optional)"
                className={styles.formInput}
                value={newProblem.editorial}
                onChange={(e) => setNewProblem({ ...newProblem, editorial: e.target.value })}
              />

              <textarea
                placeholder="Notes / Approach (optional)"
                className={styles.formTextarea}
                value={newProblem.notes}
                onChange={(e) => setNewProblem({ ...newProblem, notes: e.target.value })}
              />

              {error && (
                <p className={styles.errorMessage}>{error}</p>
              )}

              <div className={styles.formActions}>
                <Button 
                  className={styles.saveButton}
                  onClick={addProblem}
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Problem"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowProblemModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
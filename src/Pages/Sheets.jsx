// src/pages/Sheets.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore";
import { Button } from "../../components/ui/Button";
import SheetCard from "../../components/SheetCard";
import styles from "./Sheets.module.css";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";

export default function Sheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSheet, setNewSheet] = useState({ name: "", description: "" });

  // Fetch sheets and calculate stats
  useEffect(() => {
    const fetchSheets = async () => {
      if (!auth.currentUser) return;

      try {
        setLoading(true);
        
        // Fetch sheets
        const sheetsRef = collection(db, "sheets");
        const sheetsQuery = query(sheetsRef, where("user", "==", auth.currentUser.uid));
        const sheetsSnapshot = await getDocs(sheetsQuery);
        const userSheets = sheetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // For each sheet, calculate stats
        const sheetsWithStats = [];
        for (const sheet of userSheets) {
          // Fetch problems for this sheet
          const problemsRef = collection(db, "problems");
          const problemsQuery = query(
            problemsRef,
            where("user", "==", auth.currentUser.uid),
            where("sheetId", "==", sheet.id)
          );
          const problemsSnapshot = await getDocs(problemsQuery);
          
          const problems = problemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const solvedCount = problems.filter(p => p.status === "Solved").length;
          const problemCount = problems.length;
          
          sheetsWithStats.push({
            ...sheet,
            problemCount,
            solvedCount
          });
        }
        
        setSheets(sheetsWithStats);
      } catch (err) {
        console.error("Error fetching sheets:", err);
        alert("Failed to load sheets");
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, []);

  const createSheet = async () => {
    if (!newSheet.name.trim()) {
      alert("Please enter a sheet name");
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
      const newSheetObj = { id: docRef.id, ...sheetData, problemCount: 0, solvedCount: 0 };
      
      setSheets(prev => [...prev, newSheetObj]);
      setShowCreateModal(false);
      setNewSheet({ name: "", description: "" });
    } catch (err) {
      console.error("Error creating sheet:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteSheet = async (sheetId) => {
    if (!window.confirm("Are you sure you want to delete this sheet? All problems in it will be permanently deleted.")) {
      return;
    }

    try {
      // Delete all problems in the sheet
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

      // Delete the sheet
      await deleteDoc(doc(db, "sheets", sheetId));
      
      // Update local state
      setSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
    } catch (err) {
      console.error("Error deleting sheet:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.sheetsPage}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Custom Sheets</h1>
        <Button onClick={() => setShowCreateModal(true)} className={styles.createButton}>
          + Create New Sheet
        </Button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading sheets...</div>
      ) : sheets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't created any sheets yet.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Sheet
          </Button>
        </div>
      ) : (
        <div className={styles.sheetsGrid}>
          {sheets.map(sheet => (
            <SheetCard
              key={sheet.id}
              sheet={sheet}
              problemCount={sheet.problemCount}
              solvedCount={sheet.solvedCount}
              onDelete={deleteSheet}
            />
          ))}
        </div>
      )}

      {/* Create Sheet Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create New Sheet</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sheet Name *</label>
                <Input
                  type="text"
                  value={newSheet.name}
                  onChange={(e) => setNewSheet({...newSheet, name: e.target.value})}
                  placeholder="e.g., Array Problems"
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description (optional)</label>
                <Textarea
                  value={newSheet.description}
                  onChange={(e) => setNewSheet({...newSheet, description: e.target.value})}
                  className={styles.textarea}
                  placeholder="Brief description of this sheet..."
                />
              </div>

              <div className={styles.formActions}>
                <Button onClick={createSheet} disabled={loading}>
                  {loading ? "Creating..." : "Create Sheet"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
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
// src/pages/Sheets.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore";
import { Button } from "../../components/ui/Button";
import SheetCard from "../../components/SheetCard";
import styles from "./Sheets.module.css";

export default function Sheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);

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
    const name = prompt("Enter sheet name:");
    if (!name) return;

    const description = prompt("Enter sheet description (optional):") || "";
    
    setLoading(true);
    try {
      const sheetsRef = collection(db, "sheets");
      const sheetData = {
        name: name.trim(),
        description: description.trim(),
        user: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(sheetsRef, sheetData);
      const newSheetObj = { id: docRef.id, ...sheetData, problemCount: 0, solvedCount: 0 };
      
      setSheets(prev => [...prev, newSheetObj]);
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
        <Button onClick={createSheet} className={styles.createButton}>
          + Create New Sheet
        </Button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading sheets...</div>
      ) : sheets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't created any sheets yet.</p>
          <Button onClick={createSheet}>
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
    </div>
  );
}
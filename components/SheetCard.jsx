import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import styles from "./SheetCard.module.css";


export default function SheetCard({ sheet, problemCount, solvedCount, onDelete }) {
  const progress = problemCount > 0 ? Math.round((solvedCount / problemCount) * 100) : 0;
  
  return (
    <Card className={styles.sheetCard}>
      {/* Progress Bar */}
      <div className={`${styles.progressBar} ${progress === 100 ? styles.fullProgress : ''}`} style={{ width: `${progress}%` }}>
        <span className={styles.progressText}>{progress}%</span>
      </div>
      
      <CardContent>
        <div className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>{sheet.name}</h3>
          <p className={styles.sheetDescription}>{sheet.description || "\u00A0"}</p>
        </div>
        
        <div className={styles.sheetStats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>☰</span>
            <span>{problemCount} Questions</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>✓</span>
            <span className={styles.solvedCount}>{solvedCount} Solved</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>📅</span>
            <span>{new Date(sheet.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className={styles.sheetActions}>
          <Link to={`/sheets/${sheet.id}`} className={styles.viewButton}>
            View Problems
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(sheet.id)}
            className={styles.deleteButton}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import styles from "./Profile.module.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    linkedinUrl: "",
    contact: "",
    bio: "",
    college: "",
    graduationYear: "",
    skills: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;

      try {
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            name: data.name || "",
            linkedinUrl: data.linkedinUrl || "",
            contact: data.contact || "",
            bio: data.bio || "",
            college: data.college || "",
            graduationYear: data.graduationYear || "",
            skills: data.skills || ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage("Error loading profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setMessage("");

    try {
      const profileData = {
        ...profile,
        email: currentUser.email,
        uid: currentUser.uid,
        updatedAt: new Date(),
        createdAt: new Date()
      };

      await setDoc(doc(db, "users", currentUser.uid), profileData, { merge: true });
      
      setMessage("Profile updated successfully! 🎉");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error saving profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const validateLinkedInUrl = (url) => {
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    return !url || linkedinPattern.test(url);
  };

  if (loading) {
    return (
      <div className={styles.profile}>
        <h2 className={styles.pageTitle}>My Profile 👤</h2>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      <h2 className={styles.pageTitle}>My Profile 👤</h2>
      
      {message && (
        <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}

      <Card className={styles.profileCard}>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <Input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
                <small className={styles.hint}>This name will be displayed on the leaderboard</small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <Input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className={styles.disabledInput}
                />
                <small className={styles.hint}>Email cannot be changed</small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Contact Number</label>
                <Input
                  type="tel"
                  name="contact"
                  value={profile.contact}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Professional Information</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>LinkedIn Profile</label>
                <Input
                  type="url"
                  name="linkedinUrl"
                  value={profile.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/your-profile"
                />
                {profile.linkedinUrl && !validateLinkedInUrl(profile.linkedinUrl) && (
                  <small className={styles.error}>Please enter a valid LinkedIn URL</small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>College/University</label>
                <Input
                  type="text"
                  name="college"
                  value={profile.college}
                  onChange={handleChange}
                  placeholder="Your college or university name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Graduation Year</label>
                <Input
                  type="number"
                  name="graduationYear"
                  value={profile.graduationYear}
                  onChange={handleChange}
                  placeholder="2024"
                  min="1990"
                  max="2030"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Skills</label>
                <Input
                  type="text"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  placeholder="JavaScript, Python, React, etc."
                />
                <small className={styles.hint}>Separate skills with commas</small>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>About Me</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Bio</label>
                <Textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself, your goals, and interests..."
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Button 
                type="submit" 
                disabled={saving || (profile.linkedinUrl && !validateLinkedInUrl(profile.linkedinUrl))}
                className={styles.saveButton}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {profile.name && (
        <Card className={styles.previewCard}>
          <CardContent>
            <h3 className={styles.sectionTitle}>Profile Preview</h3>
            <div className={styles.preview}>
              <div className={styles.previewHeader}>
                <h4>{profile.name}</h4>
                <p>{currentUser?.email}</p>
              </div>
              
              {profile.college && (
                <p><strong>🎓 Education:</strong> {profile.college} {profile.graduationYear && `(${profile.graduationYear})`}</p>
              )}
              
              {profile.skills && (
                <p><strong>💻 Skills:</strong> {profile.skills}</p>
              )}
              
              {profile.bio && (
                <p><strong>📝 Bio:</strong> {profile.bio}</p>
              )}
              
              <div className={styles.previewLinks}>
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.linkedinLink}>
                    🔗 LinkedIn Profile
                  </a>
                )}
                {profile.contact && (
                  <span className={styles.contact}>📞 {profile.contact}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
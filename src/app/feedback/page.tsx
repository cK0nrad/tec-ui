/*
Temporaray page so I dont really care of how good it is done
*/
"use client";
import { useState } from "react";
import styles from "./page.module.css";

type Translations = {
    nextLang: string;
    switchLang: string;
    title: string;
    subTitle: string;
    survey: {
        title: string;
        where: string;
        why: string;
        easy: string;
        easyOptions: {
            yes: string;
            partially: string;
            notReally: string;
            notAtAll: string;
        };
        explainEasy: string;
    };
    feedback: {
        title: string;
        email: string;
        feedback: string;
    };
    submit: string;
};

const english = {
    nextLang: "fr",
    switchLang: "Passer en français",
    title: "Since some people use this website quite often, I wanted to learn more about you and hear any suggestions for improvement (each form can be submitted 5 times every 24 hours).",
    subTitle: "Answer none, one, or both as you wish!",
    survey: {
        title: "Micro Survey",
        where: "Where or how did you find this tool?",
        why: "Why do you use this tool?",
        easy: "Is it easy to use?",
        easyOptions: {
            yes: "Yes",
            partially: "Partially",
            notReally: "Not really",
            notAtAll: "Not at all",
        },
        explainEasy: "If you wish to explain, please do so:",
    },
    feedback: {
        title: "Suggestions for Improvement or Questions",
        email: "Email (in case I need to contact you):",
        feedback: "Feedback:",
    },
    submit: "Submit",
} as Translations;

const french = {
    nextLang: "en",
    switchLang: "Switch to english",
    title: "Comme certaines personnes utilisent souvent ce site, je souhaiterais en savoir plus sur vous et connaître vos suggestions ou améliorations (les deux formulaires peuvent être utilisés 5 fois toutes les 24 heures).",
    subTitle: "Répondez à aucun, à un ou aux deux si vous le desirez !",
    survey: {
        title: "Micro sondage",
        where: "Où/Comment avez-vous trouvé cet outil?",
        why: "Pourquoi utilisez-vous cet outil?",
        easy: "Est-ce facile à utiliser ?",
        easyOptions: {
            yes: "Oui",
            partially: "Partiellement",
            notReally: "Pas vraiment",
            notAtAll: "Pas du tout",
        },
        explainEasy: "Si vous souhaitez expliquer :",
    },
    feedback: {
        title: "Améliorations/Demandes/Questions",
        email: "Email (au cas où vous souhaiteriez que je vous contacte) :",
        feedback: "Votre avis/suggestions :",
    },
    submit: "Envoyer",
} as Translations;

export default function Feedback() {
    const [lang, setLang] = useState(english);

    const [where, setWhere] = useState("");
    const [why, setWhy] = useState("");
    const [easy, setEasy] = useState("yes");
    const [explainEasy, setExplainEasy] = useState("");

    const [email, setEmail] = useState("");
    const [feedback, setFeedback] = useState("");

    const sendSurvey = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const survey = {
            where,
            why,
            easy,
            explainEasy,
        };
        console.log(JSON.stringify(survey));

        const req = await fetch("https://api.ckonrad.io/feedback/survey", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(survey),
        });

        if (req.status !== 200) {
            alert("Error sending survey. Maybe you have reached the limit.");
            return;
        }

        alert("Survey sent! thank you for your time.");
    };

    const sendFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const feedBack = {
            email,
            feedback,
        };
        console.log(JSON.stringify(feedBack));

        const req = await fetch("https://api.ckonrad.io/feedback/suggestions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(feedBack),
        });

        if (req.status !== 200) {
            alert("Error sending feedback. Maybe you have reached the limit.");
            return;
        }

        alert("Feedback sent! thank you for your time.");
    };

    const changeLang = () => {
        switch (lang.nextLang) {
            case "fr":
                setLang(french);
                break;
            case "en":
                setLang(english);
                break;
            default:
                setLang(english);
                break;
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <button className={`${styles.input} ${styles.button}`} onClick={() => document.location.href = "/"}>
                    Back to map
                </button>
                <button className={`${styles.input} ${styles.button}`} onClick={changeLang}>
                    {lang.switchLang}
                </button>
            </div>
            <div style={{ marginBottom: 10 }}>
                Data is anonymized and deleted 14 days after submission to allow time for review.
            </div>

            <div
                style={{
                    maxWidth: 750,
                }}
            >
                <p> {lang.title}</p>
                <br />
                <p>{lang.subTitle}</p>
                <br />

                <p style={{ fontWeight: "bold", textDecoration: "underline" }}>
                    {lang.survey.title}
                </p>
                <form className={styles.form} onSubmit={sendSurvey}>
                    <label style={{ flex: 1 }}>{lang.survey.where}</label>
                    <textarea
                        value={where}
                        onChange={(e) => setWhere(e.target.value)}
                        style={{
                            resize: "vertical",
                        }}
                        className={styles.input}
                        maxLength={10000}
                        required
                    />

                    <label style={{ flex: 1 }}>{lang.survey.why}</label>
                    <textarea
                        value={why}
                        onChange={(e) => setWhy(e.target.value)}
                        style={{
                            resize: "vertical",
                        }}
                        className={styles.input}
                        maxLength={10000}
                        required
                    />

                    <label style={{ flex: 1 }}>{lang.survey.easy}</label>
                    <select
                        value={easy}
                        className={styles.input}
                        onChange={(e) => setEasy(e.target.value)}
                        required
                    >
                        <option value="yes">{lang.survey.easyOptions.yes}</option>
                        <option value="partially">{lang.survey.easyOptions.partially}</option>
                        <option value="notReally">{lang.survey.easyOptions.notReally}</option>
                        <option value="notAtAll">{lang.survey.easyOptions.notAtAll}</option>
                    </select>
                    <label style={{ flex: 1 }}>{lang.survey.explainEasy}</label>
                    <textarea
                        style={{
                            resize: "vertical",
                        }}
                        value={explainEasy}
                        onChange={(e) => setExplainEasy(e.target.value)}
                        className={styles.input}
                        maxLength={10000}
                        required
                    />
                    <input
                        type="submit"
                        value={lang.submit}
                        className={`${styles.input} ${styles.button}`}
                    />
                </form>

                <p style={{ fontWeight: "bold", textDecoration: "underline" }}>
                    {lang.feedback.title}
                </p>
                <form className={styles.form} onSubmit={sendFeedback}>
                    <label style={{ flex: 1 }}>{lang.feedback.email}</label>
                    <input
                        type="email"
                        name="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label style={{ flex: 1 }}>{lang.feedback.feedback}</label>
                    <textarea
                        style={{
                            resize: "vertical",
                        }}
                        className={styles.input}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        maxLength={10000}
                    />
                    <input
                        type="submit"
                        value={lang.submit}
                        className={`${styles.input} ${styles.button}`}
                    />
                </form>
            </div>
        </div>
    );
}

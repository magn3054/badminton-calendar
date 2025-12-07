//Calendar/CustomHourDropdown.jsx
import { useState, useRef, useEffect } from "react";
import styles from "./CustomHourDropdown.module.css";

export default function CustomHourDropdown({ value, onChange, placeholder, placement }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef();
    const listRef = useRef();

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (open && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight / 1.5;
        }
    }, [open]);

    const hours = Array.from({ length: 24 }, (_, i) => i + 1);

    return (
        <div className={styles.dropdown} ref={dropdownRef}>
            <button className={styles.dropdownButton} onClick={() => setOpen(!open)}>
                {value ? `${parseInt(value)}:00` : placeholder}
            </button>
            {open && (
                <ul
                    ref={listRef}
                    className={styles.options}
                    style={{
                        '--dropdown-top': dropdownRef.current
                            ? dropdownRef.current.getBoundingClientRect().bottom + 'px'
                            : '0px'
                    }}
                >
                    {hours.map((hour) => (
                        <li
                            key={hour}
                            onClick={() => {
                                onChange(String(hour).padStart(2, "0"));
                                setOpen(false);
                            }}
                            className={value === String(hour).padStart(2, "0") ? styles.selected : ""}
                        >
                            {hour}:00
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

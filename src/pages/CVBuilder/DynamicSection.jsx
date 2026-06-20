import { useState } from "react";
import styles from "./CVBuilder.module.css";
import { ICONS } from "../../utils/icons";

export default function DynamicSection({ icon, label, items, setItems, fields }) {
  const addItem = () => {
    setItems([...items, {}]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionHeadLeft}>
          <span className={styles.sectionIcon}>{ICONS[icon]}</span>
          <span className={styles.sectionLabel}>{label}</span>
        </span>
      </div>
      <div className={styles.sectionBody}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.dynamicItem}>
            {fields.map((f) => (
              <input
                key={f.name}
                name={f.name}
                placeholder={f.placeholder}
                className={styles.input}
                value={item[f.name] || ""}
                onChange={(e) => updateItem(idx, f.name, e.target.value)}
              />
            ))}
            <button className={styles.btnAdd} onClick={() => removeItem(idx)}>
              {ICONS.trash || "🗑"} Supprimer
            </button>
          </div>
        ))}
        <button className={styles.btnAdd} onClick={addItem}>
          {ICONS.plus} Ajouter {label}
        </button>
      </div>
    </div>
  );
}
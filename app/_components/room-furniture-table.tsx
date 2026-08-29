"use client";

import { useEffect, useState } from "react";
import RoomFurnitureModelPreview from "@/app/_components/room-furniture-model-preview";
import {
  roomDeviceCategories,
  roomDevices,
  type DeviceStateKey,
  type RoomDeviceCategory,
} from "@/app/_lib/room-state";

type RoomFurnitureTableProps = {
  onOpenChange: (open: boolean) => void;
  onSelect: (key: DeviceStateKey) => void;
  open: boolean;
  selectedDevices: readonly DeviceStateKey[];
};

export default function RoomFurnitureTable({
  onOpenChange,
  onSelect,
  open,
  selectedDevices,
}: RoomFurnitureTableProps) {
  const [category, setCategory] = useState<RoomDeviceCategory>("全部");
  const [previewsMounted, setPreviewsMounted] = useState(open);
  const models = roomDevices.filter(
    (device) => category === "全部" || device.category === category,
  );

  useEffect(() => {
    if (open) {
      setPreviewsMounted(true);
    }
  }, [open]);

  return (
    <div className="room-furniture-control" data-open={open}>
      <section
        className="room-furniture-panel"
        id="room-furniture-panel"
        aria-hidden={!open}
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === "transform" &&
            !open
          ) {
            setPreviewsMounted(false);
          }
        }}
      >
        <header>
          <nav aria-label="家具类别">
            {roomDeviceCategories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </header>
        <div className="room-furniture-panel__scroll">
          <ul className="room-furniture-models">
            {models.map(({ name, key }) => (
              <li key={key}>
                {previewsMounted ? (
                  <RoomFurnitureModelPreview device={key} />
                ) : null}
                <button
                  type="button"
                  aria-pressed={selectedDevices.includes(key)}
                  onClick={() => onSelect(key)}
                >
                  {selectedDevices.includes(key) ? (
                    <span className="room-furniture-model__selected" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <path d="m4 8.2 2.45 2.45L12.2 4.9" />
                      </svg>
                    </span>
                  ) : null}
                  <span aria-hidden="true" />
                  <span className="room-furniture-model__name">
                    <strong>{name}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <button
        className="room-furniture-toggle"
        type="button"
        aria-controls="room-furniture-panel"
        aria-expanded={open}
        aria-label={open ? "收起家具表" : "展开家具表"}
        onClick={() => onOpenChange(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5 12 5.5l7 7M12 6v13" />
        </svg>
      </button>
    </div>
  );
}

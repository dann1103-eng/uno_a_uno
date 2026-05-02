"use client";

import Link from "next/link";

type Student = {
  id: string;
  name: string;
};

export function StudentTabs({
  students,
  activeId,
}: {
  students: Student[];
  activeId: string;
}) {
  if (students.length <= 1) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {students.map((student) => {
        const isActive = student.id === activeId;
        const firstName = student.name.split(" ")[0];
        return (
          <Link
            key={student.id}
            href={`?alumno=${student.id}`}
            className={
              isActive
                ? "px-4 py-2 rounded-lg text-sm font-semibold bg-[#1e3a5f] text-white"
                : "px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#1e3a5f] border border-[#1e3a5f]/20 hover:bg-[#1e3a5f]/5 transition-colors"
            }
          >
            {firstName}
          </Link>
        );
      })}
    </div>
  );
}

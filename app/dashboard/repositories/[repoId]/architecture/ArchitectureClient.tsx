"use client";

import { useState } from "react";

interface Service {
  name: string;
  icon: string;
  color: string;
  count: number;
  files: string[];
  tech: string;
}

interface Language {
  name: string;
  count: number;
  percentage: number;
}

interface Architecture {
  services: Service[];
  languages: Language[];
  totalFiles: number;
}

interface Repo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  totalFiles: number;
  totalComponents: number;
  totalAPIs: number;
  totalModels: number;
  healthScore: number;
}

interface Props {
  repo: Repo;
  architecture: Architecture;
}

export default function ArchitectureClient({ repo, architecture }: Props) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const langColors = ["#c3c0ff", "#4cd7f6", "#ddb7ff", "#93e8ff", "#918fa1"];

  return (
    <div className="flex-1 p-stack-xl max-w-container-max mx-auto w-full">
      {/* Page Header */}
      <div className="mb-stack-xl">
        <div className="flex items-center gap-2 text-label-xs text-primary mb-2">
          <span className="material-symbols-outlined text-[16px]">folder</span>
          <span className="uppercase tracking-wider">Project: {repo.name}</span>
          <span className="text-outline-variant mx-1">/</span>
          <span className="text-on-surface-variant">Analysis Report</span>
        </div>
        <h1 className="font-display-lg text-on-surface mb-4">
          Architecture Deep Dive
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-3xl leading-relaxed">
          A comprehensive structural analysis of the current codebase. This
          report details system boundaries, component hierarchies, architectural
          patterns, and dependency health.
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-12 gap-gutter mb-stack-xl">
        <section
          className={
            isZoomed
              ? "fixed inset-4 z-[9999] glass-panel rounded-xl p-8 overflow-hidden flex flex-col bg-[#0b1326]/95 backdrop-blur-3xl shadow-2xl border border-primary/40 transition-all duration-300"
              : "col-span-12 glass-panel rounded-xl p-6 relative overflow-hidden group transition-all duration-300"
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/0 to-tertiary-container/0 group-hover:from-primary-container/5 group-hover:to-tertiary-container/5 transition-all duration-500 pointer-events-none" />

          {/* Section Header */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  schema
                </span>
                System Overview
              </h2>
              <p className="text-body-sm text-outline-variant mt-1">
                High-level macro architecture and service boundaries.
              </p>
            </div>
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-on-surface-variant hover:text-primary transition-colors z-20 relative bg-white/5 p-2 rounded-lg"
            >
              <span className="material-symbols-outlined">
                {isZoomed ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>

          {/* Diagram */}
          <div
            className={`relative w-full bg-surface-container/30 rounded-lg border border-white/5 p-6 flex flex-col justify-between overflow-hidden gap-4 ${
              isZoomed ? "flex-1 min-h-[500px]" : "min-h-[320px]"
            }`}
          >
            {/* Client Layer */}
            <div className="w-full flex justify-center gap-8 relative z-10">
              <div className="glass-card px-6 py-3 rounded-lg border-t-2 border-t-primary-container w-48 text-center flex flex-col items-center gap-2 shadow-lg">
                <span className="material-symbols-outlined text-primary-fixed-dim">
                  web
                </span>
                <span className="font-body-sm font-semibold text-on-surface">
                  {repo.name}
                </span>
                <span className="font-code-md text-[10px] text-outline-variant">
                  {repo.language ?? "Unknown"}
                </span>
              </div>
              <div className="glass-card px-6 py-3 rounded-lg border-t-2 border-t-tertiary-container w-48 text-center flex flex-col items-center gap-2 shadow-lg opacity-60">
                <span className="material-symbols-outlined text-tertiary-fixed-dim">
                  api
                </span>
                <span className="font-body-sm font-semibold text-on-surface">
                  {repo.totalAPIs > 0
                    ? `${repo.totalAPIs} API Routes`
                    : "No APIs detected"}
                </span>
                <span className="font-code-md text-[10px] text-outline-variant">
                  {repo.totalAPIs > 0 ? "REST Endpoints" : "—"}
                </span>
              </div>
            </div>

            {/* Arrow down */}
            <div className="w-full flex justify-center relative z-10">
              <div className="w-px h-10 bg-gradient-to-b from-primary/50 to-secondary/50 relative">
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center bg-surface w-6 h-6 rounded-full border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    arrow_downward
                  </span>
                </div>
              </div>
            </div>

            {/* API Gateway */}
            {/* API Gateway */}
            <div className="w-full flex justify-center relative z-10">
              <div className="bg-surface-container-high/80 border border-white/10 px-8 py-3 rounded w-[60%] text-center shadow-lg backdrop-blur-sm relative">
                <div className="absolute inset-y-0 left-0 w-1 bg-secondary-container rounded-l" />
                <span className="font-code-md text-on-secondary-container">
                  {architecture.services.find((s) => s.name === "API Layer")
                    ? `API Layer — ${architecture.services.find((s) => s.name === "API Layer")?.count} routes`
                    : "No API Gateway detected"}
                </span>
              </div>
            </div>

            {/* Arrow down */}
            <div className="w-full flex justify-center relative z-10">
              <div className="w-px h-10 bg-gradient-to-b from-secondary/50 to-primary/50" />
            </div>

            {/* Services Layer */}
            <div className="w-full relative z-10">
              {architecture.services.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
                      category
                    </span>
                    <p
                      className="text-sm text-on-surface-variant mt-2"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      No services detected — reconnect repo to analyze
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-4">
                  {architecture.services.map((service) => (
                    <div
                      key={service.name}
                      onClick={() =>
                        setSelectedService(
                          selectedService?.name === service.name
                            ? null
                            : service,
                        )
                      }
                      className="flex-1 glass-card p-4 rounded border flex flex-col h-28 relative overflow-hidden cursor-pointer transition-all duration-200"
                      style={{
                        borderColor:
                          selectedService?.name === service.name
                            ? service.color
                            : "rgba(255,255,255,0.1)",
                        boxShadow:
                          selectedService?.name === service.name
                            ? `0 0 20px ${service.color}20`
                            : "none",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ color: service.color }}
                        >
                          {service.icon}
                        </span>
                        <span className="font-body-sm font-semibold text-on-surface">
                          {service.name}
                        </span>
                      </div>
                      <div className="mt-auto flex justify-between items-end">
                        <span className="font-code-md text-[10px] text-outline-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {service.tech}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="font-code-md text-[10px]"
                            style={{ color: service.color }}
                          >
                            {service.count} files
                          </span>
                          <div className="w-2 h-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* DB Layer */}
            <div className="w-full flex justify-center gap-8 relative z-10 flex-wrap">
              {architecture.services.find((s) => s.name === "Database") ? (
                <>
                  <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-white/5">
                    <span className="material-symbols-outlined text-[18px] text-outline-variant">
                      database
                    </span>
                    <span className="font-code-md text-[12px] text-on-surface-variant">
                      {architecture.services.find((s) => s.name === "Database")
                        ?.tech ?? "Database"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-white/5">
                    <span className="material-symbols-outlined text-[18px] text-outline-variant">
                      folder_data
                    </span>
                    <span className="font-code-md text-[12px] text-on-surface-variant">
                      {architecture.services.find((s) => s.name === "Database")
                        ?.count ?? 0}{" "}
                      model files
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-white/5">
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">
                    database
                  </span>
                  <span className="font-code-md text-[12px] text-on-surface-variant">
                    No DB layer detected
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Language + Stats */}
      <div className="grid grid-cols-12 gap-gutter mb-stack-xl">
        {/* Language Distribution */}
        <section className="col-span-12 md:col-span-6 glass-panel rounded-xl p-6">
          <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">
              translate
            </span>
            Language Distribution
          </h2>
          <div className="space-y-4">
            {architecture.languages.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
                  translate
                </span>
                <p
                  className="text-sm text-on-surface-variant mt-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  No language data — reconnect repo to analyze
                </p>
              </div>
            ) : (
              architecture.languages.map((lang, i) => (
                <div key={lang.name} className="flex items-center gap-4">
                  <div className="w-24 font-code-md text-[13px] text-on-surface-variant truncate">
                    {lang.name}
                  </div>
                  <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${lang.percentage}%`,
                        background: langColors[i],
                      }}
                    />
                  </div>
                  <div className="w-10 text-right font-code-md text-[13px] text-on-surface">
                    {lang.percentage}%
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="col-span-12 md:col-span-6 glass-panel rounded-xl p-6">
          <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-tertiary">
              bar_chart
            </span>
            Repository Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Total Files",
                value: repo.totalFiles,
                icon: "folder",
                color: "#c3c0ff",
              },
              {
                label: "Components",
                value: repo.totalComponents,
                icon: "widgets",
                color: "#4cd7f6",
              },
              {
                label: "API Routes",
                value: repo.totalAPIs,
                icon: "api",
                color: "#ddb7ff",
              },
              {
                label: "DB Models",
                value: repo.totalModels,
                icon: "database",
                color: "#93e8ff",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-lg bg-surface-container/40 border border-white/5"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: stat.color }}
                >
                  {stat.icon}
                </span>
                <div
                  className="text-2xl font-bold text-on-surface mt-2"
                  style={{ fontFamily: "Geist, sans-serif" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs text-on-surface-variant mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Selected Service Files */}
        {selectedService && (
          <section className="col-span-12 glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2">
                <span
                  className="material-symbols-outlined"
                  style={{ color: selectedService.color }}
                >
                  {selectedService.icon}
                </span>
                {selectedService.name} — Key Files
                <span
                  className="text-sm font-normal ml-2"
                  style={{
                    color: selectedService.color,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  ({selectedService.count} total)
                </span>
              </h2>
              <button
                onClick={() => setSelectedService(null)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedService.files.map((file) => (
                <div
                  key={file}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-container/40 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: "#4cd7f6" }}
                  >
                    description
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 13,
                      color: "#dae2fd",
                    }}
                  >
                    {file}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

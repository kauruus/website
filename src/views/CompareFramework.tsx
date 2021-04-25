import { useEffect, useState } from "react";
import { ChartData, ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useHistory } from "react-router-dom";
import { isMobile } from "react-device-detect";

import FrameworkSelector, {
  SelectOptionFramework,
} from "../components/FrameworkSelector";
import { BenchmarkDataSet } from "../App";
import useQuery from "../hooks/useQuery";
import { COMPARED_METRICS, CONCURRENCIES, ComparedMetric } from "../common";

interface Props {
  benchmarks: BenchmarkDataSet[];
}

type ChartsData = (ComparedMetric & { chartData: ChartData })[];

function CompareFramework({ benchmarks }: Props) {
  const [charts, setCharts] = useState<ChartsData>([]);
  const [defaultFrameworkIds, setDefaultFrameworkIds] = useState<number[]>([]);
  const history = useHistory();
  const query = useQuery();

  const updateCharts = (benchmarks: BenchmarkDataSet[]) => {
    setCharts(
      COMPARED_METRICS.map((metric) => {
        const labels = CONCURRENCIES.map(
          (c) => `${!isMobile ? "Concurrency " : ""}${c}`
        );
        const datasets = benchmarks.map((b) => ({
          ...b,
          data: CONCURRENCIES.map((c) => b[`level${c}` as const][metric.key]),
        }));

        return {
          ...metric,
          chartData: { labels, datasets },
        };
      })
    );
  };

  // On charts load, scroll to hash bang
  useEffect(() => {
    const header = document.getElementById(window.location.hash.substring(1));
    if (!header) return;
    header.scrollIntoView();
  }, [charts]);

  // On Benchmark data change
  useEffect(() => {
    if (!benchmarks.length) return;

    // Get query parameter
    const frameworks = query.get("f")?.split(",");
    if (!frameworks) return;

    // Find benchmark by framework name
    const filteredBenchmark = frameworks.reduce((filtered, name) => {
      const benchmark = benchmarks.find((b) => b.framework.label === name);
      if (benchmark) filtered.push(benchmark);
      return filtered;
    }, [] as BenchmarkDataSet[]);

    setDefaultFrameworkIds(filteredBenchmark.map((b) => b.id));
    updateCharts(filteredBenchmark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarks]);

  // FrameworkSelector onChange handler
  const onFrameworkChange = (selectedOptions: SelectOptionFramework[]) => {
    // Get benchmark data from selected frameworks id
    const filteredBenchmark = selectedOptions.map(
      (option) => benchmarks.find((b) => b.id === option.value)!
    );

    // Set query parameter
    const frameworks = filteredBenchmark
      .map((b) => b.framework.label)
      .join(",");
    history.replace(`/compare?${frameworks ? "f=" + frameworks : ""}`);

    updateCharts(filteredBenchmark);
  };

  return (
    <div>
      <h3 className="text-center">Compare Frameworks</h3>

      <FrameworkSelector
        defaultValue={defaultFrameworkIds}
        options={benchmarks.map((b) => ({
          value: b.id,
          label: `${b.language.label} - ${b.framework.label} (${b.framework.version})`,
          color: b.color,
        }))}
        onChange={onFrameworkChange}
      />

      <div className="pt-md">
        {charts.map((c, i) => (
          <div className="pb-lg" key={i}>
            <h4 id={c.key} className="text-center">
              <a className="decoration-none" href={`#${c.key}`}>
                {c.longTitle || c.title}
              </a>
            </h4>
            <Bar
              type="bar"
              data={c.chartData}
              height={isMobile ? 250 : 100}
              options={
                {
                  indexAxis: isMobile ? "y" : "x",
                  animation: isMobile ? false : undefined,
                  plugins: {
                    tooltip: {
                      mode: isMobile ? "index" : "nearest",
                    },
                  },
                } as ChartOptions
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompareFramework;

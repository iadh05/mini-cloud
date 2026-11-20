import { SERVICE_CATEGORIES, SERVICES, type ServiceCategory } from "@mini-cloud/shared";
import { Outlet, useLocation } from "react-router";
import { type NavGroup, SideNav } from "../../ui/organisms/SideNav.tsx";
import { TopBar } from "../../ui/organisms/TopBar.tsx";
import { ConsoleLayout } from "../../ui/templates/ConsoleLayout.tsx";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  compute: "Compute",
  networking: "Networking",
  storage: "Storage",
  databases: "Databases",
  security: "Security",
  observability: "Monitoring",
  integration: "Integration",
  delivery: "Delivery",
  billing: "Billing",
};

/** Services the console can already show, grouped by category, from the service catalog. */
export function navGroups(pathname: string): NavGroup[] {
  const live = SERVICES.filter((service) => service.status !== "planned");
  return SERVICE_CATEGORIES.map((category) => ({
    label: CATEGORY_LABELS[category],
    items: live
      .filter((service) => service.category === category)
      .map((service) => {
        const href = `/${service.path}`;
        return { label: service.name, href, active: pathname.startsWith(href) };
      }),
  })).filter((group) => group.items.length > 0);
}

const plannedCount = SERVICES.filter((service) => service.status === "planned").length;

export function ConsoleShell() {
  const { pathname } = useLocation();
  return (
    <ConsoleLayout
      topBar={(menuButton) => <TopBar title="Mini Cloud" homeHref="/" start={menuButton} />}
      sideNav={
        <SideNav
          groups={navGroups(pathname)}
          footer={`${String(plannedCount)} more services planned`}
        />
      }
    >
      <Outlet />
    </ConsoleLayout>
  );
}

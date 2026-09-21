import Link from "next/link";
import { minitelServicesCollection } from "@/lib/collections";
import { readCollection } from "@/lib/contentStore";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";

export default async function MinitelServicesPage() {
  const services = await readCollection(minitelServicesCollection);
  const sorted = [...services].sort((a, b) => a.kioskCode.localeCompare(b.kioskCode));

  return (
    <div>
      <div className="toolbar">
        <h1>Minitel services</h1>
        <Link
          className="button primary"
          href="/minitel-services/new"
          data-testid="new-minitel-service-link"
        >
          New minitel service
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Kiosk</th>
            <th>Mnemonic</th>
            <th>Title</th>
            <th>Rights</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((service) => (
            <tr key={service.id} data-testid={`minitel-service-row-${service.id}`}>
              <td>{service.kioskCode}</td>
              <td>{service.mnemonic}</td>
              <td>
                <Link href={`/minitel-services/${service.id}`}>{service.title}</Link>
              </td>
              <td>{service.rightsStatus}</td>
              <td data-testid={`minitel-service-status-${service.id}`}>
                <StatusBadge record={service} />
              </td>
              <td>
                <DeleteButton url={`/api/minitel-services/${service.id}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

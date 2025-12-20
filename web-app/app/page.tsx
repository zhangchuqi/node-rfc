import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">SAP RFC Manager</h1>
          <p className="text-muted-foreground">Manage SAP connections and execute remote function calls</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>Manage SAP system connections</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/connections">
                <Button className="w-full">View Connections</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execute RFC</CardTitle>
              <CardDescription>Call SAP function modules</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/call">
                <Button className="w-full">Make a Call</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RFC Templates</CardTitle>
              <CardDescription>Manage predefined RFC configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rfc-templates">
                <Button className="w-full">View Templates</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>View past RFC call logs</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/logs">
                <Button className="w-full">View Logs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Badge } from "@components/ui/Badge";
import { Alert } from "@components/ui/Alert";
import { Tabs, TabItem } from "@components/ui/Tabs";

import { List, ListItem } from "@components/ui/List";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";

import { useState } from "react";

export const StyleguidePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container-max section-padding">
      {/* Header */}
      <div className="text-center mb-16 fade-in">
        <h1 className="text-gradient mb-4">FairShare Styleguide</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          A comprehensive showcase of our design system components, ensuring
          consistency and elegance across every interaction in the FairShare
          application.
        </p>
      </div>

      {/* Colors */}
      <section className="mb-20 slide-up stagger-1">
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardContent>
              Our signature warm and sophisticated color scheme that defines the
              FairShare experience.
            </CardContent>
          </CardHeader>
          <div className="space-y-8">
            {/* Primary Colors */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Primary Colors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: "primary-50", class: "bg-primary-50" },
                  { name: "primary-100", class: "bg-primary-100" },
                  { name: "primary-200", class: "bg-primary-200" },
                  { name: "primary-300", class: "bg-primary-300" },
                  { name: "primary-400", class: "bg-primary-400" },
                  { name: "primary-500", class: "bg-primary-500" },
                  { name: "primary-600", class: "bg-primary-600" },
                  { name: "primary-700", class: "bg-primary-700" },
                  { name: "primary-800", class: "bg-primary-800" },
                  { name: "primary-900", class: "bg-primary-900" },
                ].map((color) => (
                  <div key={color.name} className="text-center">
                    <div
                      className={`h-20 w-full rounded-lg ${color.class} border border-slate-200 mb-2`}
                    ></div>
                    <p className="text-xs text-slate-600 font-mono">
                      {color.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Colors */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Accent Colors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: "accent-50", class: "bg-accent-50" },
                  { name: "accent-100", class: "bg-accent-100" },
                  { name: "accent-200", class: "bg-accent-200" },
                  { name: "accent-300", class: "bg-accent-300" },
                  { name: "accent-400", class: "bg-accent-400" },
                  { name: "accent-500", class: "bg-accent-500" },
                  { name: "accent-600", class: "bg-accent-600" },
                  { name: "accent-700", class: "bg-accent-700" },
                  { name: "accent-800", class: "bg-accent-800" },
                  { name: "accent-900", class: "bg-accent-900" },
                ].map((color) => (
                  <div key={color.name} className="text-center">
                    <div
                      className={`h-20 w-full rounded-lg ${color.class} border border-slate-200 mb-2`}
                    ></div>
                    <p className="text-xs text-slate-600 font-mono">
                      {color.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Typography */}
      <section className="mb-20 slide-up stagger-2">
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardContent>
              Elegant typography hierarchy using Playfair Display for headings
              and Inter for body text.
            </CardContent>
          </CardHeader>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Headings
              </h3>
              <div className="space-y-4">
                <h1 className="font-serif font-black">
                  Heading 1 - The Main Title
                </h1>
                <h2 className="font-serif font-bold">
                  Heading 2 - Section Title
                </h2>
                <h3 className="font-serif font-semibold">
                  Heading 3 - Subsection Title
                </h3>
                <h4 className="font-serif font-medium">
                  Heading 4 - Component Title
                </h4>
                <h5 className="font-serif">Heading 5 - Small Title</h5>
                <h6 className="font-serif">Heading 6 - Micro Title</h6>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Body Text
              </h3>
              <div className="space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  Regular body text with optimal line height for readability.
                  This is how most content paragraphs will appear throughout the
                  application.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Small body text for secondary information and metadata.
                  Maintains readability while taking up less visual space.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Extra small text for captions, labels, and fine print. Used
                  sparingly for supporting information.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Buttons */}
      <section className="mb-20 slide-up stagger-3">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardContent>
              Versatile button components with multiple variants and sizes for
              different contexts.
            </CardContent>
          </CardHeader>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Button Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Button Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Forms */}
      <section className="mb-20 slide-up stagger-4">
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardContent>
              Clean and accessible form components with proper validation
              states.
            </CardContent>
          </CardHeader>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Input Fields
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Standard Input"
                    placeholder="Enter your text..."
                    helperText="This is helper text"
                  />
                </div>
                <div>
                  <Input
                    label="Input with Error"
                    placeholder="Enter your email..."
                    error="This field is required"
                  />
                </div>
                <div>
                  <Input
                    label="Disabled Input"
                    placeholder="Disabled field"
                    disabled
                  />
                </div>
                <div>
                  <Input
                    label="Password Field"
                    type="password"
                    placeholder="Enter password..."
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Badges */}
      <section className="mb-20 slide-up stagger-5">
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardContent>
              Compact status indicators with semantic color coding.
            </CardContent>
          </CardHeader>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Badge Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Badge Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Alerts */}
      <section className="mb-20 slide-up">
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardContent>
              Contextual messages for user feedback and notifications.
            </CardContent>
          </CardHeader>
          <div className="space-y-4">
            <Alert variant="info">
              This is an informational alert message to provide context or
              guidance.
            </Alert>
            <Alert variant="success">
              Success! Your action has been completed successfully.
            </Alert>
            <Alert variant="warning">
              Warning: Please review this information before proceeding.
            </Alert>
            <Alert variant="error">
              Error: Something went wrong. Please try again.
            </Alert>
          </div>
        </Card>
      </section>

      {/* Tabs */}
      <section className="mb-20 slide-up">
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardContent>
              Organized content navigation with smooth transitions.
            </CardContent>
          </CardHeader>
          <Tabs defaultTab="overview">
            <TabItem label="Overview" value="overview">
              <div className="p-4">
                <h4 className="font-semibold mb-2">Overview Content</h4>
                <p className="text-slate-600">
                  This is the overview tab content with general information.
                </p>
              </div>
            </TabItem>
            <TabItem label="Details" value="details">
              <div className="p-4">
                <h4 className="font-semibold mb-2">Detailed Information</h4>
                <p className="text-slate-600">
                  This tab contains more detailed information and
                  specifications.
                </p>
              </div>
            </TabItem>
            <TabItem label="Settings" value="settings">
              <div className="p-4">
                <h4 className="font-semibold mb-2">Settings</h4>
                <p className="text-slate-600">
                  Configuration options and settings are available here.
                </p>
              </div>
            </TabItem>
          </Tabs>
        </Card>
      </section>

      {/* Lists */}
      <section className="mb-20 slide-up">
        <Card>
          <CardHeader>
            <CardTitle>Lists</CardTitle>
            <CardContent>
              Clean and readable list components for organized content.
            </CardContent>
          </CardHeader>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Unordered List
              </h3>
              <List>
                <ListItem>First item in the list</ListItem>
                <ListItem>Second item with more detail</ListItem>
                <ListItem>Third item to complete the set</ListItem>
              </List>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Ordered List
              </h3>
              <List variant="ordered">
                <ListItem>Step one: Initialize the process</ListItem>
                <ListItem>Step two: Execute the main logic</ListItem>
                <ListItem>Step three: Finalize and cleanup</ListItem>
              </List>
            </div>
          </div>
        </Card>
      </section>

      {/* Modal */}
      <section className="mb-20 slide-up">
        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
            <CardContent>
              Overlay dialogs for focused interactions and confirmations.
            </CardContent>
          </CardHeader>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        </Card>
      </section>

      {/* Modal Component */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader
          title="Example Modal"
          onClose={() => setIsModalOpen(false)}
        />
        <ModalContent>
          <div className="space-y-4">
            <p className="text-slate-600">
              This is an example modal dialog. Modals are used to focus user
              attention on specific tasks or information.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};

import { StoryObj } from '@storybook/react';
import { Scene } from './context/Scene';
declare const meta: {
    title: string;
    component: ({ initialCameraPosition, initialCameraRotation, children, }: {
        initialCameraPosition?: import('three').Vector3Like;
        initialCameraRotation?: import('three').Euler;
        children?: import('react').ReactNode;
    }) => JSX.Element | null;
};
export default meta;
type Story = StoryObj<typeof Scene>;
export declare const Test: Story;

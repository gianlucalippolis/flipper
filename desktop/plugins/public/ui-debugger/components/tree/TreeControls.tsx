/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React, {useState} from 'react';
import {plugin} from '../../index';
import {
  Button,
  Input,
  Modal,
  Tooltip,
  Typography,
  Space,
  Switch,
  Badge,
} from 'antd';
// TODO: Fix this the next time the file is edited.
// eslint-disable-next-line rulesdir/no-restricted-imports-clone, prettier/prettier
import {Glyph} from 'flipper';
import {
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {usePlugin, useValue, Layout, theme} from 'flipper-plugin';
import {FrameworkEventMetadata, FrameworkEventType} from '../../ClientTypes';
import {
  buildTreeSelectData,
  FrameworkEventsTreeSelect,
} from '../shared/FrameworkEventsTreeSelect';

export const TreeControls: React.FC = () => {
  const instance = usePlugin(plugin);
  const searchTerm = useValue(instance.uiState.searchTerm);
  const isPaused = useValue(instance.uiState.isPaused);
  const filterMainThreadMonitoring = useValue(
    instance.uiState.filterMainThreadMonitoring,
  );

  const frameworkEventMonitoring: Map<FrameworkEventType, boolean> = useValue(
    instance.uiState.frameworkEventMonitoring,
  );

  const [showFrameworkEventsModal, setShowFrameworkEventsModal] =
    useState(false);

  const frameworkEventMetadata = useValue(instance.frameworkEventMetadata);

  const currentTraversalMode = useValue(instance.uiState.traversalMode);
  const supportedTraversalModes = useValue(
    instance.uiState.supportedTraversalModes,
  );

  const isConnected = useValue(instance.uiState.isConnected);

  return (
    <Layout.Horizontal gap="medium" pad="medium">
      <Input
        value={searchTerm}
        onChange={(e) => {
          instance.uiActions.onSearchTermUpdated(e.target.value);
        }}
        prefix={<SearchOutlined />}
        placeholder="Search"
      />
      <Button
        type="default"
        shape="circle"
        onClick={instance.uiActions.onPlayPauseToggled}
        icon={
          <Tooltip
            title={isPaused ? 'Resume live updates' : 'Pause incoming updates'}>
            {isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          </Tooltip>
        }></Button>
      {supportedTraversalModes.length > 1 &&
        supportedTraversalModes.includes('accessibility-hierarchy') && (
          <Tooltip title="Accessibility mode">
            <Button
              disabled={!isConnected}
              shape="circle"
              onClick={() => {
                if (currentTraversalMode === 'accessibility-hierarchy') {
                  instance.uiActions.onSetTraversalMode('view-hierarchy');
                } else {
                  instance.uiActions.onSetTraversalMode(
                    'accessibility-hierarchy',
                  );
                }
              }}>
              <Glyph
                name={'accessibility'}
                size={16}
                color={
                  currentTraversalMode === 'accessibility-hierarchy'
                    ? theme.primaryColor
                    : theme.textColorPrimary
                }
              />
            </Button>
          </Tooltip>
        )}
      {frameworkEventMonitoring.size > 0 && (
        <>
          <Badge
            size="small"
            count={
              [...frameworkEventMonitoring.values()].filter(
                (val) => val === true,
              ).length
            }>
            <Button
              type="default"
              shape="circle"
              onClick={() => {
                setShowFrameworkEventsModal(true);
              }}
              icon={
                <Tooltip title="Framework event monitoring">
                  <EyeOutlined />
                </Tooltip>
              }></Button>
          </Badge>
          <FrameworkEventsMonitoringModal
            showTable={() => {
              instance.uiActions.onSetViewMode({
                mode: 'frameworkEventsTable',
                isTree: false,
                nodeId: null,
              });
            }}
            metadata={frameworkEventMetadata}
            filterMainThreadMonitoring={filterMainThreadMonitoring}
            onSetFilterMainThreadMonitoring={
              instance.uiActions.onSetFilterMainThreadMonitoring
            }
            frameworkEventTypes={[...frameworkEventMonitoring.entries()]}
            onSetEventMonitored={
              instance.uiActions.onSetFrameworkEventMonitored
            }
            visible={showFrameworkEventsModal}
            onCancel={() => setShowFrameworkEventsModal(false)}
          />
        </>
      )}
    </Layout.Horizontal>
  );
};

function FrameworkEventsMonitoringModal({
  showTable,
  visible,
  onCancel,
  onSetEventMonitored,
  onSetFilterMainThreadMonitoring,
  filterMainThreadMonitoring,
  frameworkEventTypes,
  metadata,
}: {
  showTable: () => void;
  metadata: Map<FrameworkEventType, FrameworkEventMetadata>;
  visible: boolean;
  onCancel: () => void;
  onSetEventMonitored: (
    eventType: FrameworkEventType,
    monitored: boolean,
  ) => void;
  filterMainThreadMonitoring: boolean;
  onSetFilterMainThreadMonitoring: (toggled: boolean) => void;
  frameworkEventTypes: [FrameworkEventType, boolean][];
}) {
  const selectedFrameworkEvents = frameworkEventTypes
    .filter(([, selected]) => selected)
    .map(([eventType]) => eventType);

  const treeData = buildTreeSelectData(
    frameworkEventTypes.map(([type]) => type),
    metadata,
  );

  return (
    <Modal
      title={
        <Layout.Horizontal center gap="large">
          <Typography.Title level={2}>
            Framework event monitoring
          </Typography.Title>
          <Button icon={<TableOutlined />} onClick={showTable}>
            Show Table
          </Button>
        </Layout.Horizontal>
      }
      open={visible}
      footer={null}
      onCancel={onCancel}>
      <Space direction="vertical" size="large">
        <Typography.Text>
          Monitoring an event will cause the relevant node in the visualizer and
          tree to highlight briefly. Additionally counter will show the number
          of matching events in the tree
        </Typography.Text>

        <FrameworkEventsTreeSelect
          placeholder="Select node types to monitor"
          onSetEventSelected={onSetEventMonitored}
          selected={selectedFrameworkEvents}
          treeData={treeData}
        />

        <Layout.Horizontal gap="medium">
          <Switch
            checked={filterMainThreadMonitoring}
            onChange={(event) => {
              onSetFilterMainThreadMonitoring(event);
            }}
          />
          <Typography.Text>
            Only highlight events that occured on the main thread
          </Typography.Text>
        </Layout.Horizontal>
      </Space>
    </Modal>
  );
}

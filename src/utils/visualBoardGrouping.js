/**
 * Shape Grouping Utilities
 * Handles grouping and ungrouping of shapes
 */

/**
 * Group selected shapes
 * @param {Array} shapes - All shapes
 * @param {Set} selectedShapeIds - IDs of shapes to group
 * @returns {Object} { updatedShapes, newGroup }
 */
export const groupShapes = (shapes, selectedShapeIds) => {
  if (selectedShapeIds.size < 2) return { updatedShapes: shapes, newGroup: null };

  const shapesToGroup = shapes.filter(s => selectedShapeIds.has(s.id));
  if (shapesToGroup.length < 2) return { updatedShapes: shapes, newGroup: null };

  // Calculate group bounds
  const bounds = shapesToGroup.reduce((acc, s) => {
    const left = s.x;
    const right = s.x + (s.width || 0);
    const top = s.y;
    const bottom = s.y + (s.height || 0);
    return {
      left: Math.min(acc.left, left),
      right: Math.max(acc.right, right),
      top: Math.min(acc.top, top),
      bottom: Math.max(acc.bottom, bottom)
    };
  }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

  const groupId = `group_${Date.now()}`;
  const group = {
    id: groupId,
    type: 'group',
    x: bounds.left,
    y: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
    children: shapesToGroup.map(s => s.id),
    color: '#666',
    strokeWidth: 2
  };

  // Update shapes to reference group
  const updatedShapes = shapes.map(s => {
    if (selectedShapeIds.has(s.id)) {
      return { ...s, groupId, x: s.x - bounds.left, y: s.y - bounds.top }; // Relative positions
    }
    return s;
  });

  updatedShapes.push(group);

  return { updatedShapes, newGroup: group };
};

/**
 * Ungroup shapes
 * @param {Array} shapes - All shapes
 * @param {string} groupId - ID of group to ungroup
 * @returns {Array} Updated shapes
 */
export const ungroupShapes = (shapes, groupId) => {
  const group = shapes.find(s => s.id === groupId && s.type === 'group');
  if (!group) return shapes;

  // Remove group
  const withoutGroup = shapes.filter(s => s.id !== groupId);

  // Restore children with absolute positions
  const restoredShapes = withoutGroup.map(s => {
    if (s.groupId === groupId) {
      return {
        ...s,
        x: s.x + group.x,
        y: s.y + group.y,
        groupId: undefined
      };
    }
    return s;
  });

  return restoredShapes;
};

/**
 * Get all shapes in a group
 * @param {Array} shapes - All shapes
 * @param {string} groupId - Group ID
 * @returns {Array} Shapes in group
 */
export const getGroupShapes = (shapes, groupId) => {
  return shapes.filter(s => s.groupId === groupId);
};

/**
 * Move group
 * @param {Array} shapes - All shapes
 * @param {string} groupId - Group ID
 * @param {number} deltaX - X offset
 * @param {number} deltaY - Y offset
 * @returns {Array} Updated shapes
 */
export const moveGroup = (shapes, groupId, deltaX, deltaY) => {
  return shapes.map(s => {
    if (s.id === groupId && s.type === 'group') {
      return { ...s, x: s.x + deltaX, y: s.y + deltaY };
    } else if (s.groupId === groupId) {
      // Children move with group (relative positions maintained)
      return s;
    }
    return s;
  });
};

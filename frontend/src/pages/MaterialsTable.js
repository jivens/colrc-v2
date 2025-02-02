import React from "react";
import {useTable, useExpanded} from "react-table";
import AudioPlayer from '../utils/AudioPlayer';
import { Link } from 'react-router-dom';

/**
 * This function constructs a table used for displaying text data provided by the MaterialsTable function.
 * @param {*} columns Each of the columns of the DataGrid
 * @param {*} data Data to be used in the table
 * @param {*} renderRowSubComponent Renders a subcomponent for each row of the table
 * @param {*} setExpandAllChecked A boolean that checks for expanding the table
 * @returns A rendered UI for the table
 */
function Table({
  columns, 
  data, 
  renderRowSubComponent, 
  expandAllChecked }) {
   
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable(
    {
      columns,
      data,
      renderRowSubComponent,
    },
    useExpanded
  );

  React.useEffect(() => {
    for (var row of rows) {
      if (row.original.metadata?.length) {
        row.toggleRowExpanded(expandAllChecked);
      }
    }
  }, [expandAllChecked]);

  // Render the UI for your table
  return (
    <React.Fragment>
      <table className="materialsTable" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={row.getRowProps().key}>
                <tr>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    );
                  })}
                </tr>
                {row.isExpanded && renderRowSubComponent != null && (
                  <tr>
                    <td colSpan={visibleColumns.length}>
                      {renderRowSubComponent({ row })}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </React.Fragment>
  );
}
/**
 * Provides the data needed to construct the MaterialsTable using the Table function
 * @param {*} materialData An array of data representing materials that are being used
 * @param {*} setExpandAllChecked A boolean that checks for expanding the table
 * @returns A rendered MaterialsTable
 */
function MaterialsTable({ materialData, expandAllChecked }) {
  console.log(materialData, expandAllChecked);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = React.useMemo(() => [
    {
      Header: () => null,
      id: "subexpander",
      // remove arrow if engl
      Cell: ({ row }) =>
        row.original.metadata?.length ? (
          <span {...row.getToggleRowExpandedProps()}>
            {" "}
            {row.isExpanded ? "▼" : "▶"}{" "}
          </span>
        ) : (
          <span />
        ),
    },
    {
      Header: "Materials",
      id: "src",
      accessor: "source",
      Cell: ({ row }) =>
        row.original.type === "text" ? (
          <span>
            <a
              href={row.original.path}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row.original.title}
            </a>
          </span>
        ) : row.original.type === "audio" ? (
          <AudioPlayer
            key={row.original.key}
            title={row.original.title}
            speaker={row.original.speaker}
            sources={row.original.sources}
          />
        ) : row.original.type === "textimages" ? (
          <Link
            to={{
              pathname: "/imageviewer/",
              search: "?key=" + row.original.key + row.original.src,
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.original.title}
          </Link>
        ) : (
          <Link
            to={{
              pathname: "/splitview/",
              search: "?key=" + row.original.key + row.original.src,
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.original.title}
          </Link>
        ),
    },
  ]);

  const renderRowSubComponent = React.useCallback(
    ({ row }) => (
      <div>
        <MaterialMetadataTable materialMetadata={row.original.metadata} />
      </div>
    ),
    []
  );

  const [data] = React.useState(() => materialData);

  return (
    <Table
      className="materialMetadataTable"
      columns={columns}
      data={data}
      renderRowSubComponent={renderRowSubComponent}
      expandAllChecked={expandAllChecked}
    />
  );
}

function MaterialMetadataTable({ materialMetadata }) {
  console.log("this is my materialMetadata ", materialMetadata);
  const columns = React.useMemo(
    () => [
      {
        Header: "Field",
        id: "field",
        accessor: "field",
      },
      {
        Header: "Value",
        id: "value",
        accessor: "value",
      },
    ],
    []
  );

  const [data] = React.useState(() => materialMetadata);

  return <Table columns={columns} data={data} />;
}

export default MaterialsTable;

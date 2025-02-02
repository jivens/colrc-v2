import React from "react";
import {
  useTable,
  usePagination,
  useSortBy,
  useFilters,
  useGlobalFilter,
} from "react-table";
import {
  DefaultColumnFilter,
  GlobalFilter,
  fuzzyTextFilterFn,
  NarrowColumnFilter,
} from "../utils/Filters";
import { useAuth } from "../context/auth";
import { getSpellingListQuery } from "./../queries/queries";
import { sortReshape, filterReshape } from "./../utils/reshapers";
import { Button, Grid, Label, Segment } from "semantic-ui-react";
import DecoratedTextSpan from "./../utils/DecoratedTextSpan";
import TableStyles from "./../stylesheets/table-styles";
import { path_segment_permissions } from "../access/permissions";
import { useExportData } from "react-table-plugins";
import { getExportFileBlob } from "../utils/ExportFileBlob";
import { intersectionWith, isEqual } from "lodash";

function Table({
  columns,
  data,
  fetchData,
  loading,
  pageCount: controlledPageCount,
  selectValues,
}) {
  // get user information so we can check permissions
  const { user, authTokens } = useAuth();

  const filterTypes = React.useMemo(
    () => ({
      fuzzyText: fuzzyTextFilterFn,
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter, // Let's set up our default Filter UI
      minWidth: 25, // minWidth is only used as a limit for resizing
      width: 50, // width is used for both the flex-basis and flex-grow
      maxWidth: 500, // maxWidth is only used as a limit for resizing
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    state,
    allColumns,
    setHiddenColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    visibleColumns,
    prepareRow,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    exportData,
    // Get the state from the instance
    state: { pageIndex, pageSize, sortBy, filters, globalFilter },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
      }, // Pass our hoisted table state
      manualPagination: true, // Tell the usePagination
      // hook that we'll handle our own data fetching
      // This means we'll also have to provide our own
      // pageCount.
      pageCount: controlledPageCount,
      manualSortBy: true,
      manualFilters: true,
      manualGlobalFilter: true,
      defaultColumn,
      filterTypes,
      getExportFileBlob,
      getExportFileName,
      //hiddenColumns: columns.filter(column => !column.show).map(column => column.id),
      selectValues,
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExportData,
    usePagination
  );

  // Listen for changes in pagination and use the state to fetch our new data
  React.useEffect(() => {
    fetchData({ pageIndex, pageSize, sortBy, filters, globalFilter });
  }, [fetchData, pageIndex, pageSize, sortBy, filters, globalFilter]);

  React.useEffect(() => {
    setHiddenColumns(
      columns.filter((column) => !column.show).map((column) => column.id)
    );
  }, [columns, setHiddenColumns]);

  function getExportFileName({ fileType, all }) {
    let fileName = "";
    fileName = all === true ? "spell_all_cols" : "spell_sel_cols";
    return fileName;
  }
  // Render the UI for your table
  return (
    <>
      {authTokens &&
      user &&
      intersectionWith(
        path_segment_permissions["canExport"],
        user.roles,
        isEqual
      ).length >= 1 ? (
        <div>
          <Grid columns={2}>
            <Grid.Column>
              <Segment>
                <Label as="a" color="blue" ribbon>
                  export selected columns
                </Label>
                <Button.Group size="mini">
                  <Button
                    onClick={() => {
                      exportData("csv", false);
                    }}
                  >
                    to csv
                  </Button>
                  <Button.Or />
                  <Button
                    color="blue"
                    onClick={() => {
                      exportData("xlsx", false);
                    }}
                  >
                    to xlsx
                  </Button>
                  <Button.Or />
                  <Button
                    onClick={() => {
                      exportData("pdf", false);
                    }}
                  >
                    to pdf
                  </Button>
                </Button.Group>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <Label as="a" color="blue" ribbon>
                  export all columns
                </Label>
                <Button.Group size="mini">
                  <Button
                    onClick={() => {
                      exportData("csv", true);
                    }}
                  >
                    to csv
                  </Button>
                  <Button.Or />
                  <Button
                    color="blue"
                    onClick={() => {
                      exportData("xlsx", true);
                    }}
                  >
                    to xlsx
                  </Button>
                  <Button.Or />
                  <Button
                    onClick={() => {
                      exportData("pdf", true);
                    }}
                  >
                    to pdf
                  </Button>
                </Button.Group>
              </Segment>
            </Grid.Column>
          </Grid>
        </div>
      ) : (
        <div></div>
      )}
      <div className="columnToggle">
        {allColumns.map((column) => (
          <div key={column.id} className="columnToggle">
            <label>
              <input type="checkbox" {...column.getToggleHiddenProps()} />{" "}
              {column.label}
            </label>
          </div>
        ))}
      </div>
      <table {...getTableProps()}>
        <thead>
          <tr>
            <th colSpan={visibleColumns.length}>
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </th>
          </tr>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  <span {...column.getSortByToggleProps()}>
                    {column.render("Header")}
                    {column.isSorted ? (column.isSortedDesc ? "▲" : "▼") : ""}
                  </span>
                  <div>{column.canFilter ? column.render("Filter") : null}</div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
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
              </React.Fragment>
            );
          })}

          <tr>
            {loading ? (
              // Use our custom loading state to show a loading indicator
              <td colSpan="10"> Loading... </td>
            ) : (
              <td colSpan="10">
                Showing {page.length} of ~{pageCount * pageSize} results
              </td>
            )}
          </tr>
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} aria-label={"First Page"}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage} aria-label={"Previous Page"}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage} aria-label={"Next Page"}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} aria-label={"Last Page"}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function SpellingTable(props) {
  const columns = React.useMemo(
    () => [
      {
        Header: "Nicodemus",
        accessor: "nicodemus",
        width: 75,
        Filter: NarrowColumnFilter,
        tableName: "SpellingsTable",
        show: true,
        id: "nicodemus",
        label: "Nicodemus",
        Cell: ({ cell: { value } }) => <DecoratedTextSpan str={value} />,
      },
      {
        Header: "Reichard",
        accessor: "reichard",
        width: 75,
        Filter: NarrowColumnFilter,
        tableName: "SpellingsTable",
        show: false,
        id: "reichard",
        label: "Reichard",
        Cell: ({ cell: { value } }) => <DecoratedTextSpan str={value} />,
      },
      {
        Header: "Salish",
        accessor: "salish",
        width: 75,
        Filter: NarrowColumnFilter,
        tableName: "SpellingsTable",
        show: false,
        id: "salish",
        label: "Salish",
        Cell: ({ cell: { value } }) => <DecoratedTextSpan str={value} />,
      },
      {
        Header: "English",
        id: "english",
        accessor: "english",
        label: "English",
        tableName: "SpellingsTable",
        show: true,
        Cell: ({ cell: { value } }) => <DecoratedTextSpan str={value} />,
      },
      {
        Header: "Note",
        accessor: "note",
        tableName: "SpellingsTable",
        show: false,
        id: "note",
        label: "Note",
      },
    ],
    []
  );

  // We'll start our table without any data
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pageCount, setPageCount] = React.useState(0);
  //const [orderBy, setOrderBy] = React.useState([{'english': 'desc'}, {'nicodemus': 'asc'}])
  const fetchIdRef = React.useRef(0);
  const { client } = useAuth();

  async function getSpellingList(limit, offset, sortBy, filters) {
    let res = {};
    res = await client.query({
      query: getSpellingListQuery,
      variables: {
        limit: limit,
        offset: offset,
        spellings_order: sortBy,
        where: filters,
      },
    });
    return res.data;
  }

  const fetchData = React.useCallback(
    ({ pageSize, pageIndex, sortBy, filters, globalFilter }) => {
      // This will get called when the table needs new data
      // You could fetch your data from literally anywhere,
      // even a server. But for this example, we'll just fake it.

      // Give this fetch an ID
      const fetchId = ++fetchIdRef.current;

      // Set the loading state
      setLoading(true);

      // We'll even set a delay to simulate a server here
      setTimeout(() => {
        if (fetchId === fetchIdRef.current) {
          const controlledSort = sortReshape(sortBy);
          const controlledFilter = filterReshape(filters, globalFilter, []);
          getSpellingList(
            pageSize,
            pageSize * pageIndex,
            controlledSort,
            controlledFilter
          )
            .then((data) => {
              let totalCount = data.spellings_aggregate.aggregate.count;
              setData(data.spellings);
              setPageCount(Math.ceil(totalCount / pageSize));
              setLoading(false);
            })
            .catch((error) => {
              console.log(error);
              setData([]);
              setPageCount(0);
              setLoading(false);
            });
        }
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <TableStyles>
      <Table
        columns={columns}
        data={data}
        fetchData={fetchData}
        loading={loading}
        pageCount={pageCount}
      />
    </TableStyles>
  );
}

export default SpellingTable;
